// Jira Controller – Thin: validate input → call Service → format response
import * as jiraService from "../services/jiraService.js";

// ── GET /api/groups/:groupId/jira ────────────────────
export const getJiraConfig = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const config = await jiraService.getConfig(groupId);

    if (!config) {
      return res.status(200).json({
        success: true,
        message: "Jira project not configured yet",
        data: null,
      });
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/groups/:groupId/jira ───────────────────
export const configureJira = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const config = await jiraService.configure(groupId, req.body);

    res.status(201).json({
      success: true,
      message: "Jira project configured successfully",
      data: config,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── POST /api/groups/:groupId/jira/sync ──────────────
export const syncJiraIssues = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const result = await jiraService.syncIssues(groupId);

    res.status(200).json({
      success: true,
      message: `Sync completed: ${result.created} created, ${result.updated} updated`,
      data: {
        total_from_jira: result.total_from_jira,
        created: result.created,
        updated: result.updated,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── GET /api/groups/:groupId/jira/issues ─────────────
export const getIssues = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const shouldAutoSync = req.query.auto_sync !== "false";
    const issues = await jiraService.getIssues(groupId, shouldAutoSync);

    res.status(200).json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── PUT /api/groups/:groupId/jira/issues/:issueId/status ─
export const updateIssueStatus = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const issueRef = req.params.issueId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const updated = await jiraService.updateIssueStatus(groupId, issueRef, status);

    res.status(200).json({
      success: true,
      message: `Issue status updated to "${status}"`,
      data: updated,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── PUT /api/groups/:groupId/jira/issues/:issueId/assign ─
export const assignIssue = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const issueRef = req.params.issueId;

    const result = await jiraService.assignIssue(groupId, issueRef, {
      userId: req.body.user_id ?? req.body.assignee_id,
      assigneeEmail: req.body.assignee_email,
    });

    res.status(200).json({
      success: true,
      message: `Issue assigned to ${result.assignee.full_name}`,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
