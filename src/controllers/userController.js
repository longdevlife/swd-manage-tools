// ══════════════════════════════════════════════════════════
// User Controller – CRUD for Users (Admin)
// ══════════════════════════════════════════════════════════
import prisma from "../config/db.js";

// ── GET /api/users ──────────────────────────────────────
// Lấy danh sách users (hỗ trợ filter theo role)
// Roles: ADMIN
export const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const where = role && role !== "ALL" ? { role } : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        yob: true,
        phone_number: true,
        github_username: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/users/:id ──────────────────────────────────
// Lấy chi tiết 1 user
export const getUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        yob: true,
        phone_number: true,
        github_username: true,
        created_at: true,
        group_members: {
          select: {
            group: {
              select: { group_id: true, group_name: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/users/:id ──────────────────────────────────
// Cập nhật thông tin user
export const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, full_name, role, yob, phoneNumber, github_username } = req.body;

    const data = {};
    if (username) data.username = username;
    if (email) data.email = email;
    if (full_name) data.full_name = full_name;
    if (role) data.role = role;
    if (yob) data.yob = yob;
    if (phoneNumber) data.phone_number = phoneNumber;
    if (github_username) data.github_username = github_username;

    const user = await prisma.user.update({
      where: { user_id: userId },
      data,
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        yob: true,
        phone_number: true,
        github_username: true,
      },
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
