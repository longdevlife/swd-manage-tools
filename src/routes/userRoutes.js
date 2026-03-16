import { Router } from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  createUser,
  deactivateUser,
  updateUserRoles,
} from "../controllers/userController.js";
import { protect, authorize } from "../middlewares/index.js";

const router = Router();

router.use(protect);

// GET  /api/users       → ADMIN + LECTURER (danh sách users, hỗ trợ ?role=MEMBER)
router.get("/", authorize("ADMIN", "LECTURER"), getUsers);

// GET  /api/users/:id   → ADMIN hoặc chính user đó
router.get("/:id", getUserById);

// PUT  /api/users/:id   → ADMIN hoặc chính user đó
router.put("/:id", updateUser);

// POST /api/users        → ADMIN: tạo user mới
router.post("/", authorize("ADMIN"), createUser);

// PATCH /api/users/:id/deactivate → ADMIN: soft delete (is_active = false)
router.patch("/:id/deactivate", authorize("ADMIN"), deactivateUser);

// PUT  /api/users/:id/roles → ADMIN: thay thế toàn bộ roles
router.put("/:id/roles", authorize("ADMIN"), updateUserRoles);

export default router;
