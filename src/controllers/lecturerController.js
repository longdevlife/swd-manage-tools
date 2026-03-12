// Lecturer Assignment Controller
import prisma from "../config/db.js";

// ── GET /api/groups/:groupId/lecturers ───────────────
export const getAssignedLecturers = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const lecturers = await prisma.lecturer_Assignment.findMany({
      where: { group_id: groupId },
      include: {
        user: {
          select: { user_id: true, full_name: true, email: true },
        },
      },
      orderBy: { assigned_at: "asc" },
    });

    res.status(200).json({
      success: true,
      count: lecturers.length,
      data: lecturers,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/groups/:groupId/lecturers ──────────────
export const assignLecturer = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { lecturer_id } = req.body;

    if (!lecturer_id) {
      return res.status(400).json({ success: false, message: "lecturer_id is required" });
    }

    // Kiểm tra group tồn tại
    const group = await prisma.student_Group.findUnique({ where: { group_id: groupId } });
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Kiểm tra user tồn tại và có role LECTURER
    const lecturer = await prisma.user.findUnique({
      where: { user_id: parseInt(lecturer_id) },
      include: { user_roles: { include: { role: true } } },
    });
    if (!lecturer) {
      return res.status(404).json({ success: false, message: "Lecturer not found" });
    }

    const isLecturer = lecturer.user_roles.some((ur) => ur.role.role_name === "LECTURER");
    if (!isLecturer) {
      return res.status(400).json({
        success: false,
        message: "User does not have LECTURER role",
      });
    }

    // Kiểm tra đã gán chưa
    const existing = await prisma.lecturer_Assignment.findUnique({
      where: {
        lecturer_id_group_id: {
          lecturer_id: parseInt(lecturer_id),
          group_id: groupId,
        },
      },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Lecturer is already assigned to this group",
      });
    }

    const assignment = await prisma.lecturer_Assignment.create({
      data: {
        lecturer_id: parseInt(lecturer_id),
        group_id: groupId,
      },
      include: {
        user: { select: { user_id: true, full_name: true, email: true } },
        student_group: { select: { group_id: true, group_name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Lecturer assigned successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/groups/:groupId/lecturers/:lecturerId ─
export const removeLecturer = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const lecturerId = parseInt(req.params.lecturerId);

    const existing = await prisma.lecturer_Assignment.findUnique({
      where: {
        lecturer_id_group_id: {
          lecturer_id: lecturerId,
          group_id: groupId,
        },
      },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lecturer assignment not found",
      });
    }

    await prisma.lecturer_Assignment.delete({
      where: {
        lecturer_id_group_id: {
          lecturer_id: lecturerId,
          group_id: groupId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Lecturer removed from group successfully",
    });
  } catch (error) {
    next(error);
  }
};
