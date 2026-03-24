// GitHub Controller – Thin: validate input → call Service → format response
import * as githubService from "../services/githubService.js";

// ── GET /api/groups/:groupId/github ────────────────────
export const getGitConfig = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const config = await githubService.getConfig(groupId);

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
    const config = await githubService.configure(groupId, req.body);

    res.status(201).json({
      success: true,
      message: "GitHub repository configured successfully",
      data: config,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── POST /api/groups/:groupId/github/sync ────────────
export const syncCommits = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const result = await githubService.syncCommits(groupId);

    res.status(200).json({
      success: true,
      message: `Sync completed: ${result.created} new commits, ${result.skipped} skipped, ${result.linked_issues} issue links created`,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── GET /api/groups/:groupId/github/commits ──────────
export const getCommits = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const filters = {
      authorId: req.query.member ? parseInt(req.query.member) : null,
      matchStatus: req.query.status || null,
    };

    const commits = await githubService.getCommits(groupId, filters);

    res.status(200).json({
      success: true,
      count: commits.length,
      data: commits,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ── GET /api/groups/:groupId/github/commits/stats ────
export const getCommitStats = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const stats = await githubService.getCommitStats(groupId);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
