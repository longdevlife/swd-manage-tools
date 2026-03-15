// ══════════════════════════════════════════════════════════
// Role Controller – Quản lý danh sách Role (Admin only)
// ══════════════════════════════════════════════════════════
import prisma from "../config/db.js";

// ── GET /api/roles ──────────────────────────────────────
// Lấy danh sách tất cả roles trong hệ thống
// Roles: ADMIN
export const getRoles = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { role_id: "asc" },
    });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};
