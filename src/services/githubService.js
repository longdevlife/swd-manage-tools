// GitHub Service – Business logic (calls Repository + Adapter)
import * as githubRepo from "../repositories/githubRepository.js";
import GitHubAdapter from "./githubAdapter.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { matchCommitAuthorToMember } from "../utils/githubAuthorMatcher.js";

const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/gi;

// ── Helpers ─────────────────────────────────────────

const parseRepoUrl = (repoUrl) => {
  if (!repoUrl || typeof repoUrl !== "string") return {};
  const cleaned = repoUrl.trim().replace(/\.git$/i, "");

  const sshMatch = cleaned.match(/^git@github\.com:([^/]+)\/(.+)$/i);
  if (sshMatch) return { owner: sshMatch[1], repo_name: sshMatch[2] };

  const httpMatch = cleaned.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (httpMatch) return { owner: httpMatch[1], repo_name: httpMatch[2] };

  return {};
};

const normalizePayload = (body = {}, existingConfig = null) => {
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

  return { owner, repo_name: repoName, repo_url: repoUrl, github_pat: pat, hasNewPat: Boolean(rawPat) };
};

const createAdapter = async (groupId) => {
  const config = await githubRepo.findConfigByGroupId(groupId);
  if (!config) {
    const err = new Error("Git repository not configured for this group");
    err.statusCode = 404;
    throw err;
  }
  const decryptedPat = decrypt(config.github_pat);
  return { adapter: new GitHubAdapter(config.owner, config.repo_name, decryptedPat), config };
};

// ═══════════════════════════════════════════════════
// 1. GET CONFIG
// ═══════════════════════════════════════════════════
export const getConfig = async (groupId) => {
  const config = await githubRepo.findConfigByGroupIdSafe(groupId);
  return config; // null nếu chưa config
};

// ═══════════════════════════════════════════════════
// 2. CONFIGURE GITHUB
// ═══════════════════════════════════════════════════
export const configure = async (groupId, body) => {
  const existingConfig = await githubRepo.findConfigByGroupId(groupId);
  const payload = normalizePayload(body, existingConfig);

  if (!payload.repo_name || !payload.repo_url || !payload.owner || !payload.github_pat) {
    const err = new Error(
      "repo_name, repo_url, owner, and github_pat are required (supports aliases: repository_name/repository, github_token)",
    );
    err.statusCode = 400;
    throw err;
  }

  // Check group tồn tại
  const group = await githubRepo.findGroupById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  // Test kết nối GitHub trước khi lưu
  try {
    const adapter = new GitHubAdapter(payload.owner, payload.repo_name, payload.github_pat);
    await adapter.testConnection();
  } catch {
    console.error("Failed to connect to GitHub:", { owner: payload.owner, repo_name: payload.repo_name });
    const err = new Error("Cannot connect to GitHub. Please check your PAT, owner, and repo_name.");
    err.statusCode = 400;
    throw err;
  }

  // Encrypt PAT (BR-08)
  const encryptedPat = payload.hasNewPat ? encrypt(payload.github_pat) : existingConfig?.github_pat;

  return githubRepo.upsertConfig(groupId, {
    repo_name: payload.repo_name,
    repo_url: payload.repo_url,
    owner: payload.owner,
    github_pat: encryptedPat,
  });
};

// ═══════════════════════════════════════════════════
// 3. SYNC COMMITS
// ═══════════════════════════════════════════════════
export const syncCommits = async (groupId) => {
  const { adapter, config } = await createAdapter(groupId);

  // Incremental sync
  const latestCommit = await githubRepo.findLatestCommit(config.repo_id);
  const since = latestCommit ? new Date(latestCommit.committed_at).toISOString() : null;

  const githubCommits = await adapter.getAllCommits(since);
  const members = await githubRepo.findGroupMembers(groupId);
  const jiraProject = await githubRepo.findJiraProjectWithIssues(groupId);

  let created = 0, skipped = 0, unmatched = 0, linkedIssues = 0;

  for (const commit of githubCommits) {
    const sha = commit.sha;

    // Skip nếu đã tồn tại
    const exists = await githubRepo.findCommitByHash(sha);
    if (exists) { skipped++; continue; }

    const match = matchCommitAuthorToMember(commit, members);
    const matchedMember = match.member;

    // Lấy commit detail (stats)
    let stats = { additions: 0, deletions: 0 };
    try {
      const detail = await adapter.getCommitDetail(sha);
      stats = detail.stats || stats;
    } catch {
      console.warn(`⚠️ Cannot fetch stats for commit ${sha.slice(0, 7)}`);
    }

    const commitRecord = await githubRepo.createCommit({
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
    });
    created++;

    if (!matchedMember) {
      unmatched++;
      console.warn(
        `⚠️ Commit ${sha.slice(0, 7)} by "${match.metadata.authorLogin || match.metadata.authorEmail || "unknown"}" stored as unmatched`,
      );
    }

    // Flow 4: Auto-link Commit ↔ Jira Issue
    if (jiraProject && jiraProject.jira_issues.length > 0) {
      const matches = commitRecord.commit_message?.match(ISSUE_KEY_PATTERN);
      if (matches) {
        for (const issueKeyRaw of matches) {
          const issueKey = issueKeyRaw.toUpperCase();
          const jiraIssue = jiraProject.jira_issues.find(
            (ji) => ji.issue_key.toUpperCase() === issueKey,
          );
          if (jiraIssue) {
            const existingLink = await githubRepo.findCommitIssueLink(
              commitRecord.commit_id,
              jiraIssue.jira_issue_id,
            );
            if (!existingLink) {
              await githubRepo.createCommitIssueLink(commitRecord.commit_id, jiraIssue.jira_issue_id);
              linkedIssues++;
            }
          }
        }
      }
    }
  }

  return { total_from_github: githubCommits.length, created, skipped, unmatched, linked_issues: linkedIssues };
};

// ═══════════════════════════════════════════════════
// 4. GET COMMITS (local DB)
// ═══════════════════════════════════════════════════
export const getCommits = async (groupId, filters = {}) => {
  const config = await githubRepo.findConfigByGroupId(groupId);
  if (!config) {
    const err = new Error("Git repository not configured");
    err.statusCode = 404;
    throw err;
  }

  const commits = await githubRepo.findCommitsByRepo(config.repo_id, filters);

  return commits.map((c) => ({
    ...c,
    author_name: c.author?.full_name || c.author_name || c.author_login || "Unknown",
    author_email: c.author?.email || c.author_email || null,
    author_github_username: c.author?.github_username || c.author_login || null,
    match_status: c.match_status || "matched",
    commit_message: c.commit_message || "",
  }));
};

// ═══════════════════════════════════════════════════
// 5. COMMIT STATS
// ═══════════════════════════════════════════════════
export const getCommitStats = async (groupId) => {
  const config = await githubRepo.findConfigByGroupId(groupId);
  if (!config) {
    const err = new Error("Git repository not configured");
    err.statusCode = 404;
    throw err;
  }

  const stats = await githubRepo.groupCommitStatsByAuthor(config.repo_id);

  return Promise.all(
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
      const user = await githubRepo.findUserById(s.author_id);
      return {
        user,
        match_status: "matched",
        total_commits: s._count.commit_id,
        total_lines_added: s._sum.lines_added || 0,
        total_lines_deleted: s._sum.lines_deleted || 0,
      };
    }),
  );
};
