// ══════════════════════════════════════════════════════════
// Contribution Report Controller
// Phase 9 – Tổng hợp dữ liệu Commit + Jira → Contribution_Report
// ══════════════════════════════════════════════════════════
import prisma from "../config/db.js";

// ═══════════════════════════════════════════════════
// 1. GENERATE / RECALCULATE REPORT
// ═══════════════════════════════════════════════════

// ── POST /api/groups/:groupId/reports/generate ───────
// Tổng hợp dữ liệu từ Commit_Record + Jira_Issue → upsert Contribution_Report
// Roles: LEADER, LECTURER, ADMIN
export const generateReport = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    // 1. Lấy nhóm + danh sách members
    const group = await prisma.student_Group.findUnique({
      where: { group_id: groupId },
      include: {
        group_members: { select: { user_id: true } },
      },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const memberIds = group.group_members.map((m) => m.user_id);
    if (memberIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Group has no members" });
    }

    // 2. Lấy Git repo config (để query commits)
    const gitConfig = await prisma.git_Repository.findUnique({
      where: { group_id: groupId },
    });

    // 3. Lấy Jira project config (để query issues resolved)
    const jiraConfig = await prisma.jira_Project.findUnique({
      where: { group_id: groupId },
    });

    const reports = [];

    for (const userId of memberIds) {
      // ── GitHub stats ────────────────────────────────
      let totalCommits = 0;
      let totalLinesAdded = 0;
      let totalLinesDeleted = 0;

      if (gitConfig) {
        const commitStats = await prisma.commit_Record.aggregate({
          where: {
            repo_id: gitConfig.repo_id,
            author_id: userId,
          },
          _count: { commit_id: true },
          _sum: {
            lines_added: true,
            lines_deleted: true,
          },
        });

        totalCommits = commitStats._count.commit_id || 0;
        totalLinesAdded = commitStats._sum.lines_added || 0;
        totalLinesDeleted = commitStats._sum.lines_deleted || 0;
      }

      // ── Jira issues resolved ────────────────────────
      // "Resolved" = status "Done" hoặc "Closed" (case-insensitive)
      let totalIssuesResolved = 0;

      if (jiraConfig) {
        // Tìm user email để match với assignee_email
        const user = await prisma.user.findUnique({
          where: { user_id: userId },
          select: { email: true },
        });

        if (user) {
          totalIssuesResolved = await prisma.jira_Issue.count({
            where: {
              jira_project_id: jiraConfig.jira_project_id,
              assignee_email: {
                equals: user.email,
                mode: "insensitive",
              },
              status: {
                in: ["Done", "Closed", "Resolved", "done", "closed", "resolved"],
              },
            },
          });
        }
      }

      // ── Upsert Contribution_Report ──────────────────
      // Tìm report hiện tại (nếu có) → update, nếu chưa có → create
      const existingReport = await prisma.contribution_Report.findFirst({
        where: {
          group_id: groupId,
          user_id: userId,
        },
      });

      let report;
      if (existingReport) {
        report = await prisma.contribution_Report.update({
          where: { report_id: existingReport.report_id },
          data: {
            total_commits: totalCommits,
            total_issues_resolved: totalIssuesResolved,
            total_lines_added: totalLinesAdded,
            total_lines_deleted: totalLinesDeleted,
            calculated_at: new Date(),
          },
        });
      } else {
        report = await prisma.contribution_Report.create({
          data: {
            group_id: groupId,
            user_id: userId,
            total_commits: totalCommits,
            total_issues_resolved: totalIssuesResolved,
            total_lines_added: totalLinesAdded,
            total_lines_deleted: totalLinesDeleted,
          },
        });
      }

      reports.push(report);
    }

    res.status(200).json({
      success: true,
      message: `Contribution reports generated for ${reports.length} members`,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
// 2. GET REPORTS
// ═══════════════════════════════════════════════════

// ── GET /api/groups/:groupId/reports ─────────────────
// Lấy toàn bộ báo cáo đóng góp của nhóm (kèm user info)
// Roles: ALL (scoped bởi sameGroupOnly)
export const getReports = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const reports = await prisma.contribution_Report.findMany({
      where: { group_id: groupId },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            github_username: true,
          },
        },
      },
      orderBy: { total_commits: "desc" },
    });

    if (reports.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No reports generated yet. Trigger POST /reports/generate first.",
        data: [],
      });
    }

    // ── Tính contribution percentage ──────────────────
    const totalGroupCommits = reports.reduce((sum, r) => sum + r.total_commits, 0);
    const totalGroupLines = reports.reduce(
      (sum, r) => sum + r.total_lines_added + r.total_lines_deleted,
      0
    );
    const totalGroupIssues = reports.reduce(
      (sum, r) => sum + r.total_issues_resolved,
      0
    );

    const enriched = reports.map((r) => ({
      report_id: r.report_id,
      user: r.user,
      total_commits: r.total_commits,
      total_issues_resolved: r.total_issues_resolved,
      total_lines_added: r.total_lines_added,
      total_lines_deleted: r.total_lines_deleted,
      calculated_at: r.calculated_at,
      // Phần trăm đóng góp
      contribution_percentage: {
        commits: totalGroupCommits > 0
          ? Math.round((r.total_commits / totalGroupCommits) * 10000) / 100
          : 0,
        lines: totalGroupLines > 0
          ? Math.round(
              ((r.total_lines_added + r.total_lines_deleted) / totalGroupLines) *
                10000
            ) / 100
          : 0,
        issues: totalGroupIssues > 0
          ? Math.round((r.total_issues_resolved / totalGroupIssues) * 10000) / 100
          : 0,
      },
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      summary: {
        total_group_commits: totalGroupCommits,
        total_group_lines: totalGroupLines,
        total_group_issues_resolved: totalGroupIssues,
      },
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
// 3. GET PERSONAL REPORT
// ═══════════════════════════════════════════════════

// ── GET /api/groups/:groupId/reports/me ──────────────
// Lấy báo cáo đóng góp cá nhân của user đang đăng nhập
// Roles: ALL (scoped)
export const getMyReport = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.user_id;

    const report = await prisma.contribution_Report.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            github_username: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(200).json({
        success: true,
        message: "No report generated yet for you in this group.",
        data: null,
      });
    }

    // Lấy thêm tổng nhóm để tính %
    const groupTotals = await prisma.contribution_Report.aggregate({
      where: { group_id: groupId },
      _sum: {
        total_commits: true,
        total_issues_resolved: true,
        total_lines_added: true,
        total_lines_deleted: true,
      },
    });

    const totalGroupCommits = groupTotals._sum.total_commits || 0;
    const totalGroupLines =
      (groupTotals._sum.total_lines_added || 0) +
      (groupTotals._sum.total_lines_deleted || 0);
    const totalGroupIssues = groupTotals._sum.total_issues_resolved || 0;

    res.status(200).json({
      success: true,
      data: {
        report_id: report.report_id,
        user: report.user,
        total_commits: report.total_commits,
        total_issues_resolved: report.total_issues_resolved,
        total_lines_added: report.total_lines_added,
        total_lines_deleted: report.total_lines_deleted,
        calculated_at: report.calculated_at,
        contribution_percentage: {
          commits: totalGroupCommits > 0
            ? Math.round((report.total_commits / totalGroupCommits) * 10000) / 100
            : 0,
          lines: totalGroupLines > 0
            ? Math.round(
                ((report.total_lines_added + report.total_lines_deleted) /
                  totalGroupLines) *
                  10000
              ) / 100
            : 0,
          issues: totalGroupIssues > 0
            ? Math.round(
                (report.total_issues_resolved / totalGroupIssues) * 10000
              ) / 100
            : 0,
        },
        group_summary: {
          total_group_commits: totalGroupCommits,
          total_group_lines: totalGroupLines,
          total_group_issues_resolved: totalGroupIssues,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
