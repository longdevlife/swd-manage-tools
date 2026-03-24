// User Service – Business logic
import bcrypt from "bcryptjs";
import * as userRepo from "../repositories/userRepository.js";

const flattenUser = (u) => ({
  user_id: u.user_id,
  full_name: u.full_name,
  email: u.email,
  github_username: u.github_username,
  is_active: u.is_active,
  created_at: u.created_at,
  role: u.user_roles?.[0]?.role?.role_name ?? "MEMBER",
  roles: (u.user_roles || []).map((ur) => ur.role?.role_name),
});

export const getUsers = async (roleFilter) => {
  const where = roleFilter && roleFilter !== "ALL"
    ? { user_roles: { some: { role: { role_name: roleFilter } } } }
    : {};
  const users = await userRepo.findUsers(where);
  return users.map(flattenUser);
};

export const getUserById = async (userId) => {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return flattenUser(user);
};

export const createUser = async ({ full_name, email, password, role_name }) => {
  if (!full_name || !email || !password) {
    const err = new Error("full_name, email and password are required");
    err.statusCode = 400;
    throw err;
  }

  const existing = await userRepo.findUserByEmail(email);
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 400;
    throw err;
  }

  const desiredRole = role_name || "MEMBER";
  const roleRecord = await userRepo.findRoleByName(desiredRole);
  if (!roleRecord) {
    const err = new Error(`Role "${desiredRole}" not found`);
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await userRepo.createUser({
    full_name,
    email,
    password: hashed,
    user_roles: { create: [{ role_id: roleRecord.role_id }] },
  });
  return flattenUser(user);
};

export const updateUser = async (userId, data) => {
  const updateData = {};
  if (data.email) updateData.email = data.email;
  if (data.full_name) updateData.full_name = data.full_name;
  if (data.github_username !== undefined) updateData.github_username = data.github_username;
  if (typeof data.is_active === "boolean") updateData.is_active = data.is_active;

  const user = await userRepo.updateUser(userId, updateData);
  return flattenUser(user);
};

export const deactivateUser = async (userId, currentUserId) => {
  if (currentUserId === userId) {
    const err = new Error("Cannot deactivate your own account");
    err.statusCode = 400;
    throw err;
  }
  const user = await userRepo.updateUser(userId, { is_active: false });
  return flattenUser(user);
};

export const updateUserRoles = async (userId, roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    const err = new Error("roles must be a non-empty array of role names");
    err.statusCode = 400;
    throw err;
  }

  const roleRecords = await userRepo.findRolesByNames(roles);
  if (roleRecords.length !== roles.length) {
    const found = roleRecords.map((r) => r.role_name);
    const invalid = roles.filter((r) => !found.includes(r));
    const err = new Error(`Invalid roles: ${invalid.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  const existing = await userRepo.findUserById(userId);
  if (!existing) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const user = await userRepo.transaction(async (tx) => {
    await userRepo.replaceUserRoles(tx, userId, roleRecords);
    return userRepo.findUserWithRoles(tx, userId);
  });

  return flattenUser(user);
};
