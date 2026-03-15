// Auth Controller – Prisma + JWT + Google OAuth
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";

// ── Tạo JWT ──────────────────────────────────────
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ── POST /api/auth/register ───────────────────────
export const register = async (req, res, next) => {
  try {
    const { full_name, email, password, role_name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    // Tìm Role, nếu chưa có thì có thể báo lỗi hoặc tạo (ở đây tạm auto tạo nếu chưa có để demo)
    const desiredRole = role_name || "MEMBER";
    let roleRecord = await prisma.role.findUnique({ where: { role_name: desiredRole }});
    if (!roleRecord) {
      roleRecord = await prisma.role.create({ data: { role_name: desiredRole } });
    }

    const user = await prisma.user.create({
      data: { 
        full_name, 
        email, 
        password: hashed,
        user_roles: {
           create: [{ role_id: roleRecord.role_id }]
        }
      },
      include: { user_roles: { include: { role: true } } }
    });

    const token = generateToken(user.user_id);
    const roles = user.user_roles.map(ur => ur.role.role_name);

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: { token, user: { user_id: user.user_id, full_name: user.full_name, email: user.email, roles } },
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ──────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { user_roles: { include: { role: true } } }
    });

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user.user_id);
    const roles = user.user_roles.map(ur => ur.role.role_name);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, user: { user_id: user.user_id, full_name: user.full_name, email: user.email, roles } },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/me ──────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      include: { 
        user_roles: { include: { role: true } },
        group_memberships: { include: { student_group: true } },
        group_leaderships: true,
        lecturer_assignments: true
      }
    });

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/google/callback (sau OAuth) ─────
export const googleCallback = async (req, res) => {
  const token = generateToken(req.user.user_id);

  // Lấy role(s) của user
  const userWithRoles = await prisma.user.findUnique({
    where: { user_id: req.user.user_id },
    include: { user_roles: { include: { role: true } } },
  });
  const role = userWithRoles?.user_roles?.[0]?.role?.role_name || 'MEMBER';

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const params = new URLSearchParams({
    token,
    email: req.user.email || '',
    role,
  });
  res.redirect(`${clientUrl}/auth/callback?${params}`);
};
