import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import roleRoutes from "./roleRoutes.js";
import groupRoutes from "./groupRoutes.js";
import memberRoutes from "./memberRoutes.js";
import lecturerRoutes from "./lecturerRoutes.js";
import jiraRoutes from "./jiraRoutes.js";
import githubRoutes from "./githubRoutes.js";
import reportRoutes from "./reportRoutes.js";
import syncRoutes from "./syncRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/groups", groupRoutes);
router.use("/groups/:groupId/members", memberRoutes);
router.use("/groups/:groupId/lecturers", lecturerRoutes);
router.use("/groups/:groupId/jira", jiraRoutes);
router.use("/groups/:groupId/github", githubRoutes);
router.use("/groups/:groupId/reports", reportRoutes);
router.use("/groups/:groupId/sync", syncRoutes);

export default router;
