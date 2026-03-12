import { Router } from "express";
import { protect, authorize, sameGroupOnly } from "../middlewares/index.js";
import { generateReport, getReports, getMyReport } from "../controllers/reportController.js";

const router = Router({ mergeParams: true }); // mergeParams để lấy :groupId

// ── GET  /api/groups/:groupId/reports ──────────────
// Lấy báo cáo đóng góp toàn nhóm
// Roles: ALL (scoped bởi sameGroupOnly)
router.get("/", protect, sameGroupOnly, getReports);

// ── POST /api/groups/:groupId/reports/generate ─────
// Tổng hợp / tính toán lại báo cáo
// Roles: LEADER, LECTURER, ADMIN
router.post(
  "/generate",
  protect,
  authorize("LEADER", "LECTURER", "ADMIN"),
  sameGroupOnly,
  generateReport
);

// ── GET /api/groups/:groupId/reports/me ─────────────
// Lấy báo cáo cá nhân
// Roles: ALL (scoped)
router.get("/me", protect, sameGroupOnly, getMyReport);

export default router;
