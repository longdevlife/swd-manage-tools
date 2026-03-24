// User Controller – Thin
import * as userService from "../services/userService.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers(req.query.role);
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) { next(error); }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(parseInt(req.params.id));
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(parseInt(req.params.id), req.body);
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const user = await userService.deactivateUser(parseInt(req.params.id), req.user.user_id);
    res.status(200).json({ success: true, message: "User deactivated", data: user });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const updateUserRoles = async (req, res, next) => {
  try {
    const user = await userService.updateUserRoles(parseInt(req.params.id), req.body.roles);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};
