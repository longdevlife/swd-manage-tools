// ══════════════════════════════════════════════════════════
// User Controller – CRUD for Users (Admin)
// ══════════════════════════════════════════════════════════
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";

// ── Helper: flatten user + roles into a simple response shape ──
const flattenUser = (u) => ({
  user_id: u.user_id,
  full_name: u.full_name,
  email: u.email,
  github_username: u.github_username,
  is_active: u.is_active,
  created_at: u.created_at,
  // Derive a single "role" string from the User_Role → Role relation
  role: u.user_roles?.[0]?.role?.role_name ?? "MEMBER",
  roles: (u.user_roles || []).map((ur) => ur.role?.role_name),
});

// ── GET /api/users ──────────────────────────────────────
// Lấy danh sách users (hỗ trợ filter theo role)
// Roles: ADMIN
export const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    // Build where clause — filter via the User_Role relation
    const where =
      role && role !== "ALL"
        ? {
            user_roles: {
              some: { role: { role_name: role } },
            },
          }
        : {};

    const users = await prisma.user.findMany({
      where,
      include: {
        user_roles: {
          include: { role: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(flattenUser),
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
      include: {
        user_roles: {
          include: { role: true },
        },
        group_memberships: {
          include: {
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

    res.status(200).json({ success: true, data: flattenUser(user) });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/users/:id ──────────────────────────────────
// Cập nhật thông tin user
export const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, full_name, github_username, is_active } = req.body;

    const data = {};
    if (email) data.email = email;
    if (full_name) data.full_name = full_name;
    if (github_username !== undefined) data.github_username = github_username;
    if (typeof is_active === "boolean") data.is_active = is_active;

    const user = await prisma.user.update({
      where: { user_id: userId },
      data,
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    res.status(200).json({ success: true, data: flattenUser(user) });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/users ──────────────────────────────────────────────────────────
// Tạo user mới (ADMIN)
export const createUser = async (req, res, next) => {
  try {
    const { full_name, email, password, role_name } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "full_name, email and password are required",
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const desiredRole = role_name || "MEMBER";
    const roleRecord = await prisma.role.findUnique({ where: { role_name: desiredRole } });
    if (!roleRecord) {
      return res.status(400).json({ success: false, message: `Role "${desiredRole}" not found` });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        password: hashed,
        user_roles: {
          create: [{ role_id: roleRecord.role_id }],
        },
      },
      include: { user_roles: { include: { role: true } } },
    });

    res.status(201).json({ success: true, data: flattenUser(user) });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/users/:id/deactivate ──────────────────────────────────────────
// Soft delete: set is_active = false (ADMIN)
export const deactivateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (req.user.user_id === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account",
      });
    }

    const user = await prisma.user.update({
      where: { user_id: userId },
      data: { is_active: false },
      include: { user_roles: { include: { role: true } } },
    });

    res.status(200).json({ success: true, message: "User deactivated", data: flattenUser(user) });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/users/:id/roles ──────────────────────────────────────────────────
// Thay thế toàn bộ roles của user (ADMIN, replace-all)
export const updateUserRoles = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "roles must be a non-empty array of role names",
      });
    }

    const roleRecords = await prisma.role.findMany({
      where: { role_name: { in: roles } },
    });

    if (roleRecords.length !== roles.length) {
      const found = roleRecords.map((r) => r.role_name);
      const invalid = roles.filter((r) => !found.includes(r));
      return res.status(400).json({
        success: false,
        message: `Invalid roles: ${invalid.join(", ")}`,
      });
    }

    const existing = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Transaction: xoá roles cũ → tạo roles mới
    const user = await prisma.$transaction(async (tx) => {
      await tx.user_Role.deleteMany({ where: { user_id: userId } });
      await tx.user_Role.createMany({
        data: roleRecords.map((r) => ({ user_id: userId, role_id: r.role_id })),
      });
      return tx.user.findUnique({
        where: { user_id: userId },
        include: { user_roles: { include: { role: true } } },
      });
    });

    res.status(200).json({ success: true, data: flattenUser(user) });
  } catch (error) {
    next(error);
  }
};
