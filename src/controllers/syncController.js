// ══════════════════════════════════════════════════════════
// Sync Controller – Manual Sync endpoint
// Phase 10 – POST /api/groups/:groupId/sync
// ══════════════════════════════════════════════════════════
import { syncGroup } from "../services/syncService.js";

// ── POST /api/groups/:groupId/sync ──────────────────
// Flow 3: Manual Sync — Jira → GitHub → Report
// Roles: LEADER, LECTURER, ADMIN
export const manualSync = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const results = await syncGroup(groupId);

    const hasErrors = results.errors.length > 0;

    res.status(hasErrors ? 207 : 200).json({
      success: !hasErrors,
      message: hasErrors
        ? `Sync completed with ${results.errors.length} error(s)`
        : "Full sync completed successfully",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
