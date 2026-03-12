// Member & Leader Controller
import prisma from "../config/db.js";

// ── GET /api/groups/:groupId/members ─────────────────
export const getMembers = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const members = await prisma.group_Member.findMany({
      where: { group_id: groupId },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            github_username: true,
            is_active: true,
          },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/groups/:groupId/members ────────────────
export const addMember = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    // Kiểm tra group tồn tại
    const group = await prisma.student_Group.findUnique({ where: { group_id: groupId } });
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({ where: { user_id: parseInt(user_id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Kiểm tra đã là member chưa
    const existing = await prisma.group_Member.findUnique({
      where: {
        group_id_user_id: { group_id: groupId, user_id: parseInt(user_id) },
      },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "User is already a member of this group" });
    }

    const member = await prisma.group_Member.create({
      data: { group_id: groupId, user_id: parseInt(user_id) },
      include: {
        user: { select: { user_id: true, full_name: true, email: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/groups/:groupId/members/:userId ──────
export const removeMember = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = parseInt(req.params.userId);

    const existing = await prisma.group_Member.findUnique({
      where: {
        group_id_user_id: { group_id: groupId, user_id: userId },
      },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Member not found in this group" });
    }

    // Nếu đang là leader → xóa luôn leader
    const isLeader = await prisma.group_Leader.findUnique({
      where: { group_id: groupId },
    });
    if (isLeader && isLeader.user_id === userId) {
      await prisma.group_Leader.delete({ where: { group_id: groupId } });
    }

    await prisma.group_Member.delete({
      where: {
        group_id_user_id: { group_id: groupId, user_id: userId },
      },
    });

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/groups/:groupId/leader ──────────────────
export const getLeader = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const leader = await prisma.group_Leader.findUnique({
      where: { group_id: groupId },
      include: {
        user: {
          select: { user_id: true, full_name: true, email: true },
        },
      },
    });

    if (!leader) {
      return res.status(200).json({
        success: true,
        message: "No leader assigned yet",
        data: null,
      });
    }

    res.status(200).json({ success: true, data: leader });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/groups/:groupId/leader ──────────────────
export const assignLeader = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    // Kiểm tra user thuộc nhóm chưa
    const isMember = await prisma.group_Member.findUnique({
      where: {
        group_id_user_id: { group_id: groupId, user_id: parseInt(user_id) },
      },
    });
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "User must be a member of the group before being assigned as leader",
      });
    }

    // Upsert: nếu đã có leader thì đổi, chưa có thì tạo mới
    const leader = await prisma.group_Leader.upsert({
      where: { group_id: groupId },
      update: { user_id: parseInt(user_id) },
      create: { group_id: groupId, user_id: parseInt(user_id) },
      include: {
        user: { select: { user_id: true, full_name: true, email: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: "Leader assigned successfully",
      data: leader,
    });
  } catch (error) {
    next(error);
  }
};
