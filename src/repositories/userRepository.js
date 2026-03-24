// User Repository – Prisma ORM queries only
import prisma from "../config/db.js";

const USER_INCLUDE = { user_roles: { include: { role: true } } };

export const findUsers = (where = {}) =>
  prisma.user.findMany({
    where,
    include: USER_INCLUDE,
    orderBy: { created_at: "desc" },
  });

export const findUserById = (userId) =>
  prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      ...USER_INCLUDE,
      group_memberships: {
        include: { student_group: { select: { group_id: true, group_name: true } } },
      },
    },
  });

export const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

export const createUser = (data) =>
  prisma.user.create({ data, include: USER_INCLUDE });

export const updateUser = (userId, data) =>
  prisma.user.update({
    where: { user_id: userId },
    data,
    include: USER_INCLUDE,
  });

export const findRoleByName = (roleName) =>
  prisma.role.findUnique({ where: { role_name: roleName } });

export const findRolesByNames = (roleNames) =>
  prisma.role.findMany({ where: { role_name: { in: roleNames } } });

export const replaceUserRoles = (tx, userId, roleRecords) =>
  tx.user_Role.deleteMany({ where: { user_id: userId } }).then(() =>
    tx.user_Role.createMany({
      data: roleRecords.map((r) => ({ user_id: userId, role_id: r.role_id })),
    }),
  );

export const findUserWithRoles = (tx, userId) =>
  tx.user.findUnique({
    where: { user_id: userId },
    include: USER_INCLUDE,
  });

export const transaction = (fn) => prisma.$transaction(fn);
