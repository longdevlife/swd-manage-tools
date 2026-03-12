import { Router } from "express";
import {
  getJiraConfig,
  configureJira,
  syncJiraIssues,
  getIssues,
  updateIssueStatus,
  assignIssue,
} from "../controllers/jiraController.js";
import { protect, authorize, sameGroupOnly } from "../middlewares/index.js";

// mergeParams: true → nhận :groupId từ parent router
const router = Router({ mergeParams: true });

router.use(protect);
router.use(sameGroupOnly);

// ── Jira Config ──────────────────────────────────────
// GET  /api/groups/:groupId/jira          → xem config
router.get("/", getJiraConfig);

// POST /api/groups/:groupId/jira          → cấu hình Jira (LEADER only trong nhóm, hoặc ADMIN)
router.post("/", authorize("ADMIN", "LEADER"), configureJira);

// ── Sync ─────────────────────────────────────────────
// POST /api/groups/:groupId/jira/sync     → kéo issues từ Jira về DB
router.post("/sync", authorize("ADMIN", "LECTURER", "LEADER"), syncJiraIssues);

// ── Issues ───────────────────────────────────────────
// GET  /api/groups/:groupId/jira/issues   → xem issues
router.get("/issues", getIssues);

// PUT  /api/groups/:groupId/jira/issues/:issueId/status → cập nhật trạng thái
router.put("/issues/:issueId/status", updateIssueStatus);

// PUT  /api/groups/:groupId/jira/issues/:issueId/assign → gán task cho member (LEADER/ADMIN)
router.put("/issues/:issueId/assign", authorize("ADMIN", "LEADER"), assignIssue);

export default router;
