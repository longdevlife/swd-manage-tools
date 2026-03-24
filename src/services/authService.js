// Auth Service – Business logic
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as authRepo from "../repositories/authRepository.js";

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const formatAuthResponse = (user) => {
  const roles = user.user_roles.map((ur) => ur.role.role_name);
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    roles,
  };
};

export const register = async ({ full_name, email, password, role_name }) => {
  const existing = await authRepo.findUserByEmail(email);
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);
  const desiredRole = role_name || "MEMBER";
  const roleRecord = await authRepo.findOrCreateRole(desiredRole);

  const user = await authRepo.createUser({
    full_name,
    email,
    password: hashed,
    user_roles: { create: [{ role_id: roleRecord.role_id }] },
  });

  const token = generateToken(user.user_id);
  return { token, user: formatAuthResponse(user) };
};

export const login = async ({ email, password }) => {
  const user = await authRepo.findUserByEmail(email);

  if (!user || !user.password) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user.user_id);
  return { token, user: formatAuthResponse(user) };
};

export const getMe = async (userId) => {
  return authRepo.findUserByIdFull(userId);
};

export const handleGoogleCallback = async (user) => {
  const token = generateToken(user.user_id);
  const userWithRoles = await authRepo.findUserByIdFull(user.user_id);
  const role = userWithRoles?.user_roles?.[0]?.role?.role_name || "MEMBER";
  return { token, email: user.email || "", role };
};
