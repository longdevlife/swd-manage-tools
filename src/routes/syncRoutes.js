import { Router } from "express";
import { protect, authorize, sameGroupOnly } from "../middlewares/index.js";
import { manualSync } from "../controllers/syncController.js";

const router = Router({ mergeParams: true });

// ── POST /api/groups/:groupId/sync ──────────────────
// Manual Sync: Jira + GitHub + Reports (Flow 3 hoàn chỉnh)
// Roles: LEADER, LECTURER, ADMIN
router.post(
  "/",
  protect,
  authorize("LEADER", "LECTURER", "ADMIN"),
  sameGroupOnly,
  manualSync
);

export default router;
