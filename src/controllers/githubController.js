// GitHub Controller – Config, Sync Commits, Commit-Issue Linking
import prisma from "../config/db.js";
import GitHubAdapter from "../services/githubAdapter.js";
import { encrypt, decrypt } from "../utils/encryption.js";

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
    const { repo_name, repo_url, owner, github_pat } = req.body;

    if (!repo_name || !repo_url || !owner || !github_pat) {
      return res.status(400).json({
        success: false,
        message: "repo_name, repo_url, owner, and github_pat are required",
      });
    }

    // Kiểm tra group tồn tại
    const group = await prisma.student_Group.findUnique({
      where: { group_id: groupId },
    });
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    // Test kết nối GitHub trước khi lưu
    try {
      const adapter = new GitHubAdapter(owner, repo_name, github_pat);
      await adapter.testConnection();
    } catch {
      return res.status(400).json({
        success: false,
        message:
          "Cannot connect to GitHub. Please check your PAT, owner, and repo_name.",
      });
    }

    // Encrypt PAT trước khi lưu (BR-08)
    const encryptedPat = encrypt(github_pat);

    // Upsert config
    const config = await prisma.git_Repository.upsert({
      where: { group_id: groupId },
      update: {
        repo_name,
        repo_url,
        owner,
        github_pat: encryptedPat,
      },
      create: {
        group_id: groupId,
        repo_name,
        repo_url,
        owner,
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

    const since = latestCommit
      ? new Date(latestCommit.committed_at).toISOString()
      : null;

    // Kéo tất cả commits từ GitHub (hoặc chỉ mới)
    const githubCommits = await adapter.getAllCommits(since);

    let created = 0;
    let skipped = 0;
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

      // Match author: GitHub username hoặc email
      const authorLogin = commit.author?.login;
      const authorEmail = commit.commit?.author?.email;

      const matchedMember = members.find(
        (m) =>
          (m.user.github_username &&
            m.user.github_username.toLowerCase() ===
              authorLogin?.toLowerCase()) ||
          m.user.email.toLowerCase() === authorEmail?.toLowerCase()
      );

      if (!matchedMember) {
        // Không tìm được tác giả trong nhóm → skip (hoặc log)
        console.warn(
          `⚠️ Commit ${sha.slice(0, 7)} by "${authorLogin || authorEmail}" – no matching group member`
        );
        skipped++;
        continue;
      }

      // Lấy chi tiết commit (stats: additions, deletions)
      let stats = { additions: 0, deletions: 0 };
      try {
        const detail = await adapter.getCommitDetail(sha);
        stats = detail.stats || stats;
      } catch {
        console.warn(
          `⚠️ Cannot fetch stats for commit ${sha.slice(0, 7)}`
        );
      }

      // Tạo commit record
      const commitRecord = await prisma.commit_Record.create({
        data: {
          repo_id: config.repo_id,
          author_id: matchedMember.user.user_id,
          commit_hash: sha,
          commit_message: (commit.commit?.message || "").slice(0, 500),
          committed_at: new Date(
            commit.commit?.author?.date || commit.commit?.committer?.date
          ),
          lines_added: stats.additions || 0,
          lines_deleted: stats.deletions || 0,
        },
      });
      created++;

      // ═══════════════════════════════════════════════
      // Flow 4: Auto-link Commit ↔ Jira Issue
      // Parse commit message bằng Regex: /[A-Z]+-\d+/
      // ═══════════════════════════════════════════════
      if (jiraProject && jiraProject.jira_issues.length > 0) {
        const issueKeyPattern = /[A-Z]+-\d+/g;
        const matches = commitRecord.commit_message?.match(issueKeyPattern);

        if (matches) {
          for (const issueKey of matches) {
            const jiraIssue = jiraProject.jira_issues.find(
              (ji) => ji.issue_key === issueKey
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

    const config = await prisma.git_Repository.findUnique({
      where: { group_id: groupId },
    });
    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Git repository not configured" });
    }

    const commits = await prisma.commit_Record.findMany({
      where: { repo_id: config.repo_id },
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

    res.status(200).json({
      success: true,
      count: commits.length,
      data: commits,
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
      return res
        .status(404)
        .json({ success: false, message: "Git repository not configured" });
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
          total_commits: s._count.commit_id,
          total_lines_added: s._sum.lines_added || 0,
          total_lines_deleted: s._sum.lines_deleted || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};
