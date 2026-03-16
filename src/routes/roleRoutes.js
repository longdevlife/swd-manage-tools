import { Router } from "express";
import { getRoles } from "../controllers/roleController.js";
import { protect, authorize } from "../middlewares/index.js";

const router = Router();

router.use(protect);
router.use(authorize("ADMIN"));

// GET /api/roles → Danh sách tất cả roles (ADMIN only)
router.get("/", getRoles);

export default router;
