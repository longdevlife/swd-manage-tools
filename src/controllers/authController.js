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
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || "MEMBER" },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ──────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/me ──────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, githubUsername: true, groupId: true, createdAt: true },
    });

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/google/callback (sau OAuth) ─────
export const googleCallback = async (req, res) => {
  // req.user được set bởi Passport strategy
  const token = generateToken(req.user.id);

  // Redirect về frontend kèm token (hoặc trả JSON tùy frontend dùng gì)
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  res.redirect(`${clientUrl}/auth/callback?token=${token}`);
};
