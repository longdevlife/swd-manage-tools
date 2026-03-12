import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import groupRoutes from "./groupRoutes.js";
import memberRoutes from "./memberRoutes.js";
import lecturerRoutes from "./lecturerRoutes.js";
import jiraRoutes from "./jiraRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/groups/:groupId/members", memberRoutes);
router.use("/groups/:groupId/lecturers", lecturerRoutes);
router.use("/groups/:groupId/jira", jiraRoutes);

export default router;
