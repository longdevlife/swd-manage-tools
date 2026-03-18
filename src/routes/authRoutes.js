import { Router } from "express";
import passport from "../config/passport.js";
import { register, login, getMe, googleCallback } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

// ── Email / Password ──────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

// ── Google OAuth ──────────────────────────────────
// Bước 1: Redirect sang Google để xin quyền
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], state: false }));

// Bước 2: Google redirect về đây sau khi user đồng ý
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/login" }),
  googleCallback
);

export default router;
