// ══════════════════════════════════════════════════════════
// User Controller – CRUD for Users (Admin)
// ══════════════════════════════════════════════════════════
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
