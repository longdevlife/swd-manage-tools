import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

// ── Protect: yêu cầu đăng nhập (JWT) ──────────────
export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. No token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Dùng Prisma thay vì Mongoose
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, groupId: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User no longer exists or is inactive." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token invalid or expired." });
  }
};

// ── Authorize: kiểm tra role (BR-03) ──────────────
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

// ── Group Scope: BR-04 ────────────────────────────
// Đảm bảo Lecturer/Member chỉ truy cập được data của nhóm mình
export const sameGroupOnly = (req, res, next) => {
  const requestedGroupId = req.params.groupId || req.query.groupId || req.body.groupId;

  // Admin có thể xem mọi group
  if (req.user.role === "ADMIN") return next();

  if (requestedGroupId && requestedGroupId !== req.user.groupId) {
    return res.status(403).json({
      success: false,
      message: "You can only access data from your own group. (BR-04)",
    });
  }
  next();
};
