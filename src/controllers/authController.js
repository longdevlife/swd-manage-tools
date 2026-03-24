// Auth Controller – Thin
import * as authService from "../services/authService.js";

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, message: "Registered successfully", data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, message: "Login successful", data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.user_id);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

export const googleCallback = async (req, res) => {
  const { token, email, role } = await authService.handleGoogleCallback(req.user);
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const params = new URLSearchParams({ token, email, role });
  res.redirect(`${clientUrl}/auth/callback?${params}`);
};
