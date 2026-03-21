// GitHub Controller – Config, Sync Commits, Commit-Issue Linking
import prisma from "../config/db.js";
import GitHubAdapter from "../services/githubAdapter.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { matchCommitAuthorToMember } from "../utils/githubAuthorMatcher.js";

const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/gi;

const parseRepoUrl = (repoUrl) => {
  if (!repoUrl || typeof repoUrl !== "string") return {};

  // Supports https://github.com/owner/repo(.git) and git@github.com:owner/repo(.git)
  const cleaned = repoUrl.trim().replace(/\.git$/i, "");
  const sshMatch = cleaned.match(/^git@github\.com:([^/]+)\/(.+)$/i);
  if (sshMatch) {
    return { owner: sshMatch[1], repo_name: sshMatch[2] };
  }

  const httpMatch = cleaned.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (httpMatch) {
    return { owner: httpMatch[1], repo_name: httpMatch[2] };
  }

  return {};
};

const normalizeGitHubConfigPayload = (body = {}, existingConfig = null) => {
  const repoUrl = body.repo_url || body.repository || existingConfig?.repo_url || null;
  const parsed = parseRepoUrl(repoUrl);

  const owner = body.owner || body.repo_owner || parsed.owner || existingConfig?.owner || null;

  const repoName =
    body.repo_name || body.repository_name || parsed.repo_name || existingConfig?.repo_name || null;

  const rawPat = body.github_pat || body.github_token || body.pat || null;
  const pat = rawPat
    ? rawPat
    : existingConfig?.github_pat
      ? decrypt(existingConfig.github_pat)
      : null;

  return {
    owner,
    repo_name: repoName,
    repo_url: repoUrl,
    github_pat: pat,
    hasNewPat: Boolean(rawPat),
  };
};

// ── Helper: Tạo GitHubAdapter từ DB config ─────────────
const getAdapter = async (groupId) => {
  const config = await prisma.git_Repository.findUnique({
    where: { group_id: groupId },
  });
  if (!config) {
    const err = new Error("Git repository not configured for this group");
    err.statusCode = 404;
    throw err;
  }

  const decryptedPat = decrypt(config.github_pat);
  return {
    adapter: new GitHubAdapter(config.owner, config.repo_name, decryptedPat),
    config,
  };
};

// ═══════════════════════════════════════════════════
// 1. GITHUB REPO CONFIG
// ═══════════════════════════════════════════════════

// ── GET /api/groups/:groupId/github ────────────────────
export const getGitConfig = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const config = await prisma.git_Repository.findUnique({
      where: { group_id: groupId },
      select: {
        repo_id: true,
        group_id: true,
        repo_name: true,
        repo_url: true,
        owner: true,
        // KHÔNG trả về github_pat (BR-08)
      },
    });

    if (!config) {
      return res.status(200).json({
        success: true,
        message: "Git repository not configured yet",
        data: null,
      });
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/groups/:groupId/github ───────────────────
export const configureGithub = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const existingConfig = await prisma.git_Repository.findUnique({
      where: { group_id: groupId },
    });

    const normalizedPayload = normalizeGitHubConfigPayload(req.body, existingConfig);

    if (
      !normalizedPayload.repo_name ||
      !normalizedPayload.repo_url ||
      !normalizedPayload.owner ||
      !normalizedPayload.github_pat
    ) {
      return res.status(400).json({
        success: false,
        message:
          "repo_name, repo_url, owner, and github_pat are required (supports aliases: repository_name/repository, github_token)",
      });
    }

    // Kiểm tra group tồn tại
    const group = await prisma.student_Group.findUnique({
      where: { group_id: groupId },
    });
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Test kết nối GitHub trước khi lưu
    try {
      const adapter = new GitHubAdapter(
        normalizedPayload.owner,
        normalizedPayload.repo_name,
        normalizedPayload.github_pat,
      );
      await adapter.testConnection();
    } catch {
      console.error("Failed to connect to GitHub with provided config:", {
        owner: normalizedPayload.owner,
        repo_name: normalizedPayload.repo_name,
        // Không log PAT
      });
      return res.status(400).json({
        success: false,
        message: "Cannot connect to GitHub. Please check your PAT, owner, and repo_name.",
      });
    }

    // Encrypt PAT trước khi lưu (BR-08)
    const encryptedPat = normalizedPayload.hasNewPat
      ? encrypt(normalizedPayload.github_pat)
      : existingConfig?.github_pat;

    // Upsert config
    const config = await prisma.git_Repository.upsert({
      where: { group_id: groupId },
      update: {
        repo_name: normalizedPayload.repo_name,
        repo_url: normalizedPayload.repo_url,
        owner: normalizedPayload.owner,
        github_pat: encryptedPat,
      },
      create: {
        group_id: groupId,
        repo_name: normalizedPayload.repo_name,
        repo_url: normalizedPayload.repo_url,
        owner: normalizedPayload.owner,
        github_pat: encryptedPat,
      },
      select: {
        repo_id: true,
        group_id: true,
        repo_name: true,
        repo_url: true,
        owner: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "GitHub repository configured successfully",
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
// 2. SYNC COMMITS (Flow 3 — GitHub portion)
// ═══════════════════════════════════════════════════

// ── POST /api/groups/:groupId/github/sync ────────────
export const syncCommits = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { adapter, config } = await getAdapter(groupId);

    // Lấy commit gần nhất trong DB để chỉ sync incremental
    const latestCommit = await prisma.commit_Record.findFirst({
      where: { repo_id: config.repo_id },
      orderBy: { committed_at: "desc" },
    });

    const since = latestCommit ? new Date(latestCommit.committed_at).toISOString() : null;

    // Kéo tất cả commits từ GitHub (hoặc chỉ mới)
    const githubCommits = await adapter.getAllCommits(since);

    let created = 0;
    let skipped = 0;
    let unmatched = 0;
    let linkedIssues = 0;

    // Lấy danh sách members trong nhóm để match author
    const members = await prisma.group_Member.findMany({
      where: { group_id: groupId },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            github_username: true,
          },
        },
      },
    });

    // Lấy Jira issues trong nhóm (để link Commit↔Issue)
    const jiraProject = await prisma.jira_Project.findUnique({
      where: { group_id: groupId },
      include: { jira_issues: true },
    });

    for (const commit of githubCommits) {
      const sha = commit.sha;

      // Skip nếu đã tồn tại
      const exists = await prisma.commit_Record.findUnique({
        where: { commit_hash: sha },
      });
      if (exists) {
        skipped++;
        continue;
      }

      const match = matchCommitAuthorToMember(commit, members);
      const matchedMember = match.member;

      // Lấy chi tiết commit (stats: additions, deletions)
      let stats = { additions: 0, deletions: 0 };
      try {
        const detail = await adapter.getCommitDetail(sha);
        stats = detail.stats || stats;
      } catch {
        console.warn(`⚠️ Cannot fetch stats for commit ${sha.slice(0, 7)}`);
      }

      // Tạo commit record
      const commitRecord = await prisma.commit_Record.create({
        data: {
          repo_id: config.repo_id,
          author_id: matchedMember?.user?.user_id || null,
          author_login: match.metadata.authorLogin,
          author_email: match.metadata.authorEmail,
          author_name: match.metadata.authorName,
          match_status: match.match_status,
          match_reason: match.match_reason,
          commit_hash: sha,
          commit_message: (commit.commit?.message || "").slice(0, 500),
          committed_at: new Date(commit.commit?.author?.date || commit.commit?.committer?.date),
          lines_added: stats.additions || 0,
          lines_deleted: stats.deletions || 0,
        },
      });
      created++;

      if (!matchedMember) {
        unmatched++;
        console.warn(
          `⚠️ Commit ${sha.slice(0, 7)} by "${match.metadata.authorLogin || match.metadata.authorEmail || "unknown"}" stored as unmatched`,
        );
      }

      // ═══════════════════════════════════════════════
      // Flow 4: Auto-link Commit ↔ Jira Issue
      // Parse commit message bằng Regex: /[A-Z]+-\d+/
      // ═══════════════════════════════════════════════
      if (jiraProject && jiraProject.jira_issues.length > 0) {
        const matches = commitRecord.commit_message?.match(ISSUE_KEY_PATTERN);

        if (matches) {
          for (const issueKeyRaw of matches) {
            const issueKey = issueKeyRaw.toUpperCase();
            const jiraIssue = jiraProject.jira_issues.find(
              (ji) => ji.issue_key.toUpperCase() === issueKey,
            );

            if (jiraIssue) {
              // Tránh duplicate
              const existingLink = await prisma.commit_Issue.findUnique({
                where: {
                  commit_id_jira_issue_id: {
                    commit_id: commitRecord.commit_id,
                    jira_issue_id: jiraIssue.jira_issue_id,
                  },
                },
              });

              if (!existingLink) {
                await prisma.commit_Issue.create({
                  data: {
                    commit_id: commitRecord.commit_id,
                    jira_issue_id: jiraIssue.jira_issue_id,
                  },
                });
                linkedIssues++;
              }
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Sync completed: ${created} new commits, ${skipped} skipped, ${linkedIssues} issue links created`,
      data: {
        total_from_github: githubCommits.length,
        created,
        skipped,
        unmatched,
        linked_issues: linkedIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
// 3. COMMITS (Local DB)
// ═══════════════════════════════════════════════════

// ── GET /api/groups/:groupId/github/commits ──────────
export const getCommits = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const memberUserId = req.query.member ? parseInt(req.query.member) : null;
    const statusFilter = req.query.status;

    const config = await prisma.git_Repository.findUnique({
      where: { group_id: groupId },
    });
    if (!config) {
      return res.status(404).json({ success: false, message: "Git repository not configured" });
    }

    const where = {
      repo_id: config.repo_id,
      ...(memberUserId ? { author_id: memberUserId } : {}),
      ...(statusFilter ? { match_status: statusFilter } : {}),
    };

    const commits = await prisma.commit_Record.findMany({
      where,
      include: {
        author: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            github_username: true,
          },
        },
        commit_issues: {
          include: {
            jira_issue: {
              select: {
                jira_issue_id: true,
                issue_key: true,
                summary: true,
              },
            },
          },
        },
      },
      orderBy: { committed_at: "desc" },
    });

    const normalized = commits.map((c) => ({
      ...c,
      author_name: c.author?.full_name || c.author_name || c.author_login || "Unknown",
      author_email: c.author?.email || c.author_email || null,
      author_github_username: c.author?.github_username || c.author_login || null,
      match_status: c.match_status || "matched",
      commit_message: c.commit_message || "",
    }));

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/groups/:groupId/github/commits/stats ────
// Thống kê commit theo từng member
export const getCommitStats = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const config = await prisma.git_Repository.findUnique({
      where: { group_id: groupId },
    });
    if (!config) {
      return res.status(404).json({ success: false, message: "Git repository not configured" });
    }

    // Aggregate commits by author
    const stats = await prisma.commit_Record.groupBy({
      by: ["author_id"],
      where: { repo_id: config.repo_id },
      _count: { commit_id: true },
      _sum: { lines_added: true, lines_deleted: true },
    });

    // Enrich with user info
    const enriched = await Promise.all(
      stats.map(async (s) => {
        if (!s.author_id) {
          return {
            user: null,
            match_status: "unmatched",
            total_commits: s._count.commit_id,
            total_lines_added: s._sum.lines_added || 0,
            total_lines_deleted: s._sum.lines_deleted || 0,
          };
        }

        const user = await prisma.user.findUnique({
          where: { user_id: s.author_id },
          select: {
            user_id: true,
            full_name: true,
            email: true,
            github_username: true,
          },
        });
        return {
          user,
          match_status: "matched",
          total_commits: s._count.commit_id,
          total_lines_added: s._sum.lines_added || 0,
          total_lines_deleted: s._sum.lines_deleted || 0,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};
