// Lecturer Repository – Prisma ORM queries only
import prisma from "../config/db.js";

export const findAssignmentsByGroup = (groupId) =>
  prisma.lecturer_Assignment.findMany({
    where: { group_id: groupId },
    include: { user: { select: { user_id: true, full_name: true, email: true } } },
    orderBy: { assigned_at: "asc" },
  });

export const findGroupById = (groupId) =>
  prisma.student_Group.findUnique({ where: { group_id: groupId } });

export const findUserWithRoles = (userId) =>
  prisma.user.findUnique({
    where: { user_id: userId },
    include: { user_roles: { include: { role: true } } },
  });

export const findAssignment = (lecturerId, groupId) =>
  prisma.lecturer_Assignment.findUnique({
    where: { lecturer_id_group_id: { lecturer_id: lecturerId, group_id: groupId } },
  });

export const createAssignment = (lecturerId, groupId) =>
  prisma.lecturer_Assignment.create({
    data: { lecturer_id: lecturerId, group_id: groupId },
    include: {
      user: { select: { user_id: true, full_name: true, email: true } },
      student_group: { select: { group_id: true, group_name: true } },
    },
  });

export const deleteAssignment = (lecturerId, groupId) =>
  prisma.lecturer_Assignment.delete({
    where: { lecturer_id_group_id: { lecturer_id: lecturerId, group_id: groupId } },
  });
