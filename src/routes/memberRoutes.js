import { Router } from "express";
import {
  getMembers,
  addMember,
  removeMember,
  getLeader,
  assignLeader,
} from "../controllers/memberController.js";
import { protect, authorize, sameGroupOnly } from "../middlewares/index.js";

// mergeParams: true → nhận :groupId từ parent router
const router = Router({ mergeParams: true });

router.use(protect);

// GET    /api/groups/:groupId/members     → ADMIN, LECTURER, LEADER (scoped)
router.get("/", sameGroupOnly, getMembers);

// POST   /api/groups/:groupId/members     → ADMIN, LECTURER
router.post("/", authorize("ADMIN", "LECTURER"), sameGroupOnly, addMember);

// DELETE /api/groups/:groupId/members/:userId → ADMIN, LECTURER
router.delete("/:userId", authorize("ADMIN", "LECTURER"), sameGroupOnly, removeMember);

// GET    /api/groups/:groupId/leader      → tất cả (scoped)
router.get("/leader", sameGroupOnly, getLeader);

// PUT    /api/groups/:groupId/leader      → ADMIN, LECTURER
router.put("/leader", authorize("ADMIN", "LECTURER"), sameGroupOnly, assignLeader);

export default router;
