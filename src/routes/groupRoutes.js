import { Router } from "express";
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";
import { protect, authorize, sameGroupOnly } from "../middlewares/index.js";

const router = Router();

// Tất cả routes cần đăng nhập
router.use(protect);

// GET  /api/groups       → ADMIN/LECTURER/LEADER/MEMBER (scoped)
router.get("/", getGroups);

// POST /api/groups       → ADMIN only
router.post("/", authorize("ADMIN"), createGroup);

// GET  /api/groups/:groupId → tất cả (scoped by group)
router.get("/:groupId", sameGroupOnly, getGroupById);

// PUT  /api/groups/:groupId → ADMIN only
router.put("/:groupId", authorize("ADMIN"), updateGroup);

// DELETE /api/groups/:groupId → ADMIN only
router.delete("/:groupId", authorize("ADMIN"), deleteGroup);

export default router;
