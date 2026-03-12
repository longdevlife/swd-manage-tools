import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return res.status(401).json({ success: false, message: "Not authorized. No token." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.id },
      include: { 
        user_roles: { include: { role: true } },
        group_memberships: true
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "User no longer exists or is inactive." });
    }

    req.user = user;
    // Lấy trước mảng role text để gọi ở middleware authorize dễ dàng
    req.user.roles = user.user_roles.map(ur => ur.role.role_name);
    
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token invalid or expired." });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check xem user có một trong những roles truyền vào hay ko
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Not authorized. Requires one of: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
};

export const sameGroupOnly = (req, res, next) => {
  const requestedGroupId = req.params.groupId || req.query.groupId || req.body.groupId;

  if (req.user.roles.includes("ADMIN")) return next();

  // Kiểm tra user có thuộc Group_Member của requestedGroupId hay không
  const belongsToGroup = req.user.group_memberships.some(gm => gm.group_id == requestedGroupId);
  
  if (requestedGroupId && !belongsToGroup) {
    return res.status(403).json({
      success: false,
      message: "You can only access data from your own group. (BR-04)",
    });
  }
  next();
};
