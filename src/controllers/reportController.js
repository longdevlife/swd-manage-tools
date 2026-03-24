// Report Controller – Thin: validate → call Service → format response
import * as reportService from "../services/reportService.js";

// ── POST /api/groups/:groupId/reports/generate ───────
export const generateReport = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const reports = await reportService.generateReport(groupId);

    res.status(200).json({
      success: true,
      message: `Contribution reports generated for ${reports.length} members`,
      data: reports,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── GET /api/groups/:groupId/reports ─────────────────
export const getReports = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { reports, summary } = await reportService.getReports(groupId);

    if (reports.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No reports generated yet. Trigger POST /reports/generate first.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      summary,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/groups/:groupId/reports/me ──────────────
export const getMyReport = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.user_id;
    const report = await reportService.getMyReport(groupId, userId);

    if (!report) {
      return res.status(200).json({
        success: true,
        message: "No report generated yet for you in this group.",
        data: null,
      });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
