// Jira Repository – Prisma ORM queries only (no business logic)
import prisma from "../config/db.js";

// ── Jira_Project ────────────────────────────────────

export const findConfigByGroupId = (groupId) =>
  prisma.jira_Project.findUnique({ where: { group_id: groupId } });

export const findConfigByGroupIdSafe = (groupId) =>
  prisma.jira_Project.findUnique({
    where: { group_id: groupId },
    select: {
      jira_project_id: true,
      group_id: true,
      project_key: true,
      project_name: true,
      base_url: true,
      jira_email: true,
      // Không trả jira_api_token (BR-08)
    },
  });

export const upsertConfig = (groupId, data) =>
  prisma.jira_Project.upsert({
    where: { group_id: groupId },
    update: data,
    create: { group_id: groupId, ...data },
    select: {
      jira_project_id: true,
      group_id: true,
      project_key: true,
      project_name: true,
      base_url: true,
      jira_email: true,
    },
  });

// ── Jira_Issue ──────────────────────────────────────

export const findIssuesByProjectId = (jiraProjectId) =>
  prisma.jira_Issue.findMany({
    where: { jira_project_id: jiraProjectId },
    orderBy: { created_at: "desc" },
  });

export const findIssueByProjectAndKey = (jiraProjectId, issueKey) =>
  prisma.jira_Issue.findFirst({
    where: { jira_project_id: jiraProjectId, issue_key: issueKey },
  });

export const findIssueById = (jiraIssueId) =>
  prisma.jira_Issue.findUnique({ where: { jira_issue_id: jiraIssueId } });

export const createIssue = (data) =>
  prisma.jira_Issue.create({ data });

export const updateIssue = (jiraIssueId, data) =>
  prisma.jira_Issue.update({
    where: { jira_issue_id: jiraIssueId },
    data,
  });

// ── Group_Member ────────────────────────────────────

export const findMemberByGroupAndUser = (groupId, userId) =>
  prisma.group_Member.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    include: { user: { select: { user_id: true, full_name: true, email: true } } },
  });

export const findMemberByGroupAndEmail = (groupId, email) =>
  prisma.group_Member.findFirst({
    where: { group_id: groupId, user: { email } },
    include: { user: { select: { user_id: true, full_name: true, email: true } } },
  });

// ── Helpers ─────────────────────────────────────────

export const findGroupById = (groupId) =>
  prisma.student_Group.findUnique({ where: { group_id: groupId } });
