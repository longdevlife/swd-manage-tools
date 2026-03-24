// GitHub Repository – Prisma ORM queries only (no business logic)
import prisma from "../config/db.js";

// ── Git_Repository ──────────────────────────────────

export const findConfigByGroupId = (groupId) =>
  prisma.git_Repository.findUnique({ where: { group_id: groupId } });

export const findConfigByGroupIdSafe = (groupId) =>
  prisma.git_Repository.findUnique({
    where: { group_id: groupId },
    select: {
      repo_id: true,
      group_id: true,
      repo_name: true,
      repo_url: true,
      owner: true,
      // Không trả github_pat (BR-08)
    },
  });

export const upsertConfig = (groupId, data) =>
  prisma.git_Repository.upsert({
    where: { group_id: groupId },
    update: data,
    create: { group_id: groupId, ...data },
    select: {
      repo_id: true,
      group_id: true,
      repo_name: true,
      repo_url: true,
      owner: true,
    },
  });

// ── Commit_Record ───────────────────────────────────

export const findLatestCommit = (repoId) =>
  prisma.commit_Record.findFirst({
    where: { repo_id: repoId },
    orderBy: { committed_at: "desc" },
  });

export const findCommitByHash = (hash) =>
  prisma.commit_Record.findUnique({ where: { commit_hash: hash } });

export const createCommit = (data) =>
  prisma.commit_Record.create({ data });

export const findCommitsByRepo = (repoId, filters = {}) =>
  prisma.commit_Record.findMany({
    where: {
      repo_id: repoId,
      ...(filters.authorId ? { author_id: filters.authorId } : {}),
      ...(filters.matchStatus ? { match_status: filters.matchStatus } : {}),
    },
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

export const groupCommitStatsByAuthor = (repoId) =>
  prisma.commit_Record.groupBy({
    by: ["author_id"],
    where: { repo_id: repoId },
    _count: { commit_id: true },
    _sum: { lines_added: true, lines_deleted: true },
  });

// ── Commit_Issue (link table) ───────────────────────

export const findCommitIssueLink = (commitId, jiraIssueId) =>
  prisma.commit_Issue.findUnique({
    where: {
      commit_id_jira_issue_id: { commit_id: commitId, jira_issue_id: jiraIssueId },
    },
  });

export const createCommitIssueLink = (commitId, jiraIssueId) =>
  prisma.commit_Issue.create({
    data: { commit_id: commitId, jira_issue_id: jiraIssueId },
  });

// ── Helpers (shared queries) ────────────────────────

export const findGroupById = (groupId) =>
  prisma.student_Group.findUnique({ where: { group_id: groupId } });

export const findGroupMembers = (groupId) =>
  prisma.group_Member.findMany({
    where: { group_id: groupId },
    include: {
      user: {
        select: { user_id: true, email: true, github_username: true },
      },
    },
  });

export const findJiraProjectWithIssues = (groupId) =>
  prisma.jira_Project.findUnique({
    where: { group_id: groupId },
    include: { jira_issues: true },
  });

export const findUserById = (userId) =>
  prisma.user.findUnique({
    where: { user_id: userId },
    select: { user_id: true, full_name: true, email: true, github_username: true },
  });
