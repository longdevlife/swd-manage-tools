import { Router } from "express";
import { getUsers, getUserById, updateUser } from "../controllers/userController.js";
import { protect, authorize } from "../middlewares/index.js";

const router = Router();

router.use(protect);

// GET  /api/users       → ADMIN only (danh sách users, hỗ trợ ?role=MEMBER)
router.get("/", authorize("ADMIN"), getUsers);

// GET  /api/users/:id   → ADMIN hoặc chính user đó
router.get("/:id", getUserById);

// PUT  /api/users/:id   → ADMIN hoặc chính user đó
router.put("/:id", updateUser);

export default router;
