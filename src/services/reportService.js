// Report Service – Business logic (calls Repository)
import * as reportRepo from "../repositories/reportRepository.js";

// ═══════════════════════════════════════════════════
// 1. GENERATE / RECALCULATE REPORT
// ═══════════════════════════════════════════════════
export const generateReport = async (groupId) => {
  const group = await reportRepo.findGroupWithMembers(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  const memberIds = group.group_members.map((m) => m.user_id);
  if (memberIds.length === 0) {
    const err = new Error("Group has no members");
    err.statusCode = 400;
    throw err;
  }

  const gitConfig = await reportRepo.findGitConfigByGroupId(groupId);
  const jiraConfig = await reportRepo.findJiraConfigByGroupId(groupId);
  const reports = [];

  for (const userId of memberIds) {
    // GitHub stats
    let totalCommits = 0, totalLinesAdded = 0, totalLinesDeleted = 0;
    if (gitConfig) {
      const stats = await reportRepo.aggregateCommitStats(gitConfig.repo_id, userId);
      totalCommits = stats._count.commit_id || 0;
      totalLinesAdded = stats._sum.lines_added || 0;
      totalLinesDeleted = stats._sum.lines_deleted || 0;
    }

    // Jira issues resolved
    let totalIssuesResolved = 0;
    if (jiraConfig) {
      const user = await reportRepo.findUserEmail(userId);
      if (user) {
        totalIssuesResolved = await reportRepo.countResolvedIssues(
          jiraConfig.jira_project_id, user.email,
        );
      }
    }

    // Upsert report
    const existing = await reportRepo.findReport(groupId, userId);
    const reportData = {
      total_commits: totalCommits,
      total_issues_resolved: totalIssuesResolved,
      total_lines_added: totalLinesAdded,
      total_lines_deleted: totalLinesDeleted,
    };

    let report;
    if (existing) {
      report = await reportRepo.updateReport(existing.report_id, { ...reportData, calculated_at: new Date() });
    } else {
      report = await reportRepo.createReport({ group_id: groupId, user_id: userId, ...reportData });
    }
    reports.push(report);
  }

  return reports;
};

// ═══════════════════════════════════════════════════
// 2. GET REPORTS (enriched with contribution %)
// ═══════════════════════════════════════════════════
export const getReports = async (groupId) => {
  const reports = await reportRepo.findReportsByGroup(groupId);
  if (reports.length === 0) return { reports: [], summary: null };

  const totalGroupCommits = reports.reduce((s, r) => s + r.total_commits, 0);
  const totalGroupLines = reports.reduce((s, r) => s + r.total_lines_added + r.total_lines_deleted, 0);
  const totalGroupIssues = reports.reduce((s, r) => s + r.total_issues_resolved, 0);

  const enriched = reports.map((r) => ({
    report_id: r.report_id,
    user: r.user,
    total_commits: r.total_commits,
    total_issues_resolved: r.total_issues_resolved,
    total_lines_added: r.total_lines_added,
    total_lines_deleted: r.total_lines_deleted,
    calculated_at: r.calculated_at,
    contribution_percentage: {
      commits: totalGroupCommits > 0 ? Math.round((r.total_commits / totalGroupCommits) * 10000) / 100 : 0,
      lines: totalGroupLines > 0 ? Math.round(((r.total_lines_added + r.total_lines_deleted) / totalGroupLines) * 10000) / 100 : 0,
      issues: totalGroupIssues > 0 ? Math.round((r.total_issues_resolved / totalGroupIssues) * 10000) / 100 : 0,
    },
  }));

  return {
    reports: enriched,
    summary: {
      total_group_commits: totalGroupCommits,
      total_group_lines: totalGroupLines,
      total_group_issues_resolved: totalGroupIssues,
    },
  };
};

// ═══════════════════════════════════════════════════
// 3. GET MY REPORT
// ═══════════════════════════════════════════════════
export const getMyReport = async (groupId, userId) => {
  const report = await reportRepo.findReport(groupId, userId);
  if (!report) return null;

  const user = await reportRepo.findUserEmail(userId);
  const groupTotals = await reportRepo.aggregateGroupTotals(groupId);

  const totalGroupCommits = groupTotals._sum.total_commits || 0;
  const totalGroupLines = (groupTotals._sum.total_lines_added || 0) + (groupTotals._sum.total_lines_deleted || 0);
  const totalGroupIssues = groupTotals._sum.total_issues_resolved || 0;

  return {
    ...report,
    contribution_percentage: {
      commits: totalGroupCommits > 0 ? Math.round((report.total_commits / totalGroupCommits) * 10000) / 100 : 0,
      lines: totalGroupLines > 0 ? Math.round(((report.total_lines_added + report.total_lines_deleted) / totalGroupLines) * 10000) / 100 : 0,
      issues: totalGroupIssues > 0 ? Math.round((report.total_issues_resolved / totalGroupIssues) * 10000) / 100 : 0,
    },
    group_summary: {
      total_group_commits: totalGroupCommits,
      total_group_lines: totalGroupLines,
      total_group_issues_resolved: totalGroupIssues,
    },
  };
};
