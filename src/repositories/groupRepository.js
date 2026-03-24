// Group Repository – Prisma ORM queries only
import prisma from "../config/db.js";

const GROUP_INCLUDE_FULL = {
  group_members: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
  group_leaders: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
  lecturer_assignments: { include: { user: { select: { user_id: true, full_name: true, email: true } } } },
};

export const findAllGroups = () =>
  prisma.student_Group.findMany({ include: GROUP_INCLUDE_FULL, orderBy: { created_at: "desc" } });

export const findGroupsByLecturer = (lecturerId) =>
  prisma.student_Group.findMany({
    where: { lecturer_assignments: { some: { lecturer_id: lecturerId } } },
    include: GROUP_INCLUDE_FULL,
    orderBy: { created_at: "desc" },
  });

export const findGroupsByMember = (userId) =>
  prisma.student_Group.findMany({
    where: { group_members: { some: { user_id: userId } } },
    include: GROUP_INCLUDE_FULL,
    orderBy: { created_at: "desc" },
  });

export const findGroupById = (groupId) =>
  prisma.student_Group.findUnique({
    where: { group_id: groupId },
    include: {
      ...GROUP_INCLUDE_FULL,
      group_members: {
        include: { user: { select: { user_id: true, full_name: true, email: true, github_username: true } } },
      },
      jira_project: true,
      git_repository: true,
    },
  });

export const createGroup = (data) =>
  prisma.student_Group.create({ data });

export const updateGroup = (groupId, data) =>
  prisma.student_Group.update({ where: { group_id: groupId }, data });

export const deleteGroup = (groupId) =>
  prisma.student_Group.delete({ where: { group_id: groupId } });

export const findGroupByIdSimple = (groupId) =>
  prisma.student_Group.findUnique({ where: { group_id: groupId } });
