import { Router } from "express";
import {
  getAssignedLecturers,
  assignLecturer,
  removeLecturer,
} from "../controllers/lecturerController.js";
import { protect, authorize } from "../middlewares/index.js";

// mergeParams: true → nhận :groupId từ parent router
const router = Router({ mergeParams: true });

router.use(protect);

// Tất cả lecturer assignment routes chỉ ADMIN mới thao tác
router.use(authorize("ADMIN"));

// GET    /api/groups/:groupId/lecturers
router.get("/", getAssignedLecturers);

// POST   /api/groups/:groupId/lecturers
router.post("/", assignLecturer);

// DELETE /api/groups/:groupId/lecturers/:lecturerId
router.delete("/:lecturerId", removeLecturer);

export default router;
