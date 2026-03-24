// Member Repository – Prisma ORM queries only
import prisma from "../config/db.js";

export const findMembersByGroup = (groupId) =>
  prisma.group_Member.findMany({
    where: { group_id: groupId },
    include: {
      user: { select: { user_id: true, full_name: true, email: true, github_username: true, is_active: true } },
    },
    orderBy: { joined_at: "asc" },
  });

export const findMember = (groupId, userId) =>
  prisma.group_Member.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: userId } },
  });

export const createMember = (groupId, userId) =>
  prisma.group_Member.create({
    data: { group_id: groupId, user_id: userId },
    include: { user: { select: { user_id: true, full_name: true, email: true } } },
  });

export const deleteMember = (groupId, userId) =>
  prisma.group_Member.delete({
    where: { group_id_user_id: { group_id: groupId, user_id: userId } },
  });

export const findLeader = (groupId) =>
  prisma.group_Leader.findUnique({
    where: { group_id: groupId },
    include: { user: { select: { user_id: true, full_name: true, email: true } } },
  });

export const deleteLeader = (groupId) =>
  prisma.group_Leader.delete({ where: { group_id: groupId } });

export const upsertLeader = (groupId, userId) =>
  prisma.group_Leader.upsert({
    where: { group_id: groupId },
    update: { user_id: userId },
    create: { group_id: groupId, user_id: userId },
    include: { user: { select: { user_id: true, full_name: true, email: true } } },
  });

export const findGroupById = (groupId) =>
  prisma.student_Group.findUnique({ where: { group_id: groupId } });

export const findUserById = (userId) =>
  prisma.user.findUnique({ where: { user_id: userId } });
