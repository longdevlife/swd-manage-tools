// GitHub Routes – Config, Sync, Commits
import { Router } from "express";
import { protect, authorize, sameGroupOnly } from "../middlewares/index.js";
import {
  getGitConfig,
  configureGithub,
  syncCommits,
  getCommits,
  getCommitStats,
} from "../controllers/githubController.js";

const router = Router({ mergeParams: true }); // mergeParams để lấy :groupId

// ── All routes require authentication ──────────────
router.use(protect);

// ── GET  /api/groups/:groupId/github ────────────────
// Xem config GitHub repo (ALL – scoped by group)
router.get("/", sameGroupOnly, getGitConfig);

// ── POST /api/groups/:groupId/github ────────────────
// Cấu hình GitHub repo (LEADER, ADMIN only)
router.post("/", authorize("LEADER", "ADMIN"), sameGroupOnly, configureGithub);

// ── POST /api/groups/:groupId/github/sync ───────────
// Trigger manual sync commits từ GitHub (LEADER, LECTURER, ADMIN)
router.post(
  "/sync",
  authorize("LEADER", "LECTURER", "ADMIN"),
  sameGroupOnly,
  syncCommits
);

// ── GET  /api/groups/:groupId/github/commits ────────
// Xem danh sách commits đã sync (ALL – scoped)
router.get("/commits", sameGroupOnly, getCommits);

// ── GET  /api/groups/:groupId/github/commits/stats ──
// Thống kê commits theo member (ALL – scoped)
router.get("/commits/stats", sameGroupOnly, getCommitStats);

export default router;
