// Auth Repository – Prisma ORM queries only
import prisma from "../config/db.js";

const USER_WITH_ROLES = { user_roles: { include: { role: true } } };

export const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email }, include: USER_WITH_ROLES });

export const createUser = (data) =>
  prisma.user.create({ data, include: USER_WITH_ROLES });

export const findOrCreateRole = async (roleName) => {
  let role = await prisma.role.findUnique({ where: { role_name: roleName } });
  if (!role) {
    role = await prisma.role.create({ data: { role_name: roleName } });
  }
  return role;
};

export const findUserByIdFull = (userId) =>
  prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      ...USER_WITH_ROLES,
      group_memberships: { include: { student_group: true } },
      group_leaderships: true,
      lecturer_assignments: true,
    },
  });
