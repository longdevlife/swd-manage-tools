// Group Controller – CRUD Student_Group
import prisma from "../config/db.js";

// ── GET /api/groups ──────────────────────────────────
// ADMIN: xem tất cả | LECTURER: xem nhóm được gán
export const getGroups = async (req, res, next) => {
  try {
    let groups;

    if (req.user.roles.includes("ADMIN")) {
      groups = await prisma.student_Group.findMany({
        include: {
          group_members: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
          group_leaders: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
          lecturer_assignments: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
        },
        orderBy: { created_at: "desc" },
      });
    } else if (req.user.roles.includes("LECTURER")) {
      // Lecturer chỉ xem nhóm mình phụ trách
      groups = await prisma.student_Group.findMany({
        where: {
          lecturer_assignments: {
            some: { lecturer_id: req.user.user_id },
          },
        },
        include: {
          group_members: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
          group_leaders: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
        },
        orderBy: { created_at: "desc" },
      });
    } else {
      // LEADER/MEMBER: xem nhóm mình thuộc về
      groups = await prisma.student_Group.findMany({
        where: {
          group_members: {
            some: { user_id: req.user.user_id },
          },
        },
        include: {
          group_members: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
          group_leaders: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
        },
        orderBy: { created_at: "desc" },
      });
    }

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/groups/:groupId ─────────────────────────
export const getGroupById = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const group = await prisma.student_Group.findUnique({
      where: { group_id: groupId },
      include: {
        group_members: {
          include: {
            user: {
              select: { user_id: true, full_name: true, email: true, github_username: true },
            },
          },
        },
        group_leaders: {
          include: {
            user: {
              select: { user_id: true, full_name: true, email: true },
            },
          },
        },
        lecturer_assignments: {
          include: {
            user: {
              select: { user_id: true, full_name: true, email: true },
            },
          },
        },
        jira_project: true,
        git_repository: true,
      },
    });

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/groups ─────────────────────────────────
export const createGroup = async (req, res, next) => {
  try {
    const { group_name, semester, project_title } = req.body;

    if (!group_name || !semester || !project_title) {
      return res.status(400).json({
        success: false,
        message: "group_name, semester, and project_title are required",
      });
    }

    const group = await prisma.student_Group.create({
      data: { group_name, semester, project_title },
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/groups/:groupId ─────────────────────────
export const updateGroup = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { group_name, semester, project_title } = req.body;

    const existing = await prisma.student_Group.findUnique({
      where: { group_id: groupId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const updated = await prisma.student_Group.update({
      where: { group_id: groupId },
      data: {
        ...(group_name && { group_name }),
        ...(semester && { semester }),
        ...(project_title && { project_title }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/groups/:groupId ──────────────────────
export const deleteGroup = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const existing = await prisma.student_Group.findUnique({
      where: { group_id: groupId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    await prisma.student_Group.delete({
      where: { group_id: groupId },
    });

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
