// Report Repository – Prisma ORM queries only
import prisma from "../config/db.js";

export const findGroupWithMembers = (groupId) =>
  prisma.student_Group.findUnique({
    where: { group_id: groupId },
    include: { group_members: { select: { user_id: true } } },
  });

export const findGitConfigByGroupId = (groupId) =>
  prisma.git_Repository.findUnique({ where: { group_id: groupId } });

export const findJiraConfigByGroupId = (groupId) =>
  prisma.jira_Project.findUnique({ where: { group_id: groupId } });

export const aggregateCommitStats = (repoId, userId) =>
  prisma.commit_Record.aggregate({
    where: { repo_id: repoId, author_id: userId },
    _count: { commit_id: true },
    _sum: { lines_added: true, lines_deleted: true },
  });

export const findUserEmail = (userId) =>
  prisma.user.findUnique({
    where: { user_id: userId },
    select: { email: true },
  });

export const countResolvedIssues = (jiraProjectId, email) =>
  prisma.jira_Issue.count({
    where: {
      jira_project_id: jiraProjectId,
      assignee_email: { equals: email, mode: "insensitive" },
      status: { in: ["Done", "Closed", "Resolved", "done", "closed", "resolved"] },
    },
  });

export const findReport = (groupId, userId) =>
  prisma.contribution_Report.findFirst({
    where: { group_id: groupId, user_id: userId },
  });

export const updateReport = (reportId, data) =>
  prisma.contribution_Report.update({
    where: { report_id: reportId },
    data,
  });

export const createReport = (data) =>
  prisma.contribution_Report.create({ data });

export const findReportsByGroup = (groupId) =>
  prisma.contribution_Report.findMany({
    where: { group_id: groupId },
    include: {
      user: { select: { user_id: true, full_name: true, email: true, github_username: true } },
    },
    orderBy: { total_commits: "desc" },
  });

export const aggregateGroupTotals = (groupId) =>
  prisma.contribution_Report.aggregate({
    where: { group_id: groupId },
    _sum: {
      total_commits: true,
      total_issues_resolved: true,
      total_lines_added: true,
      total_lines_deleted: true,
    },
  });
