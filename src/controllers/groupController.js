// Group Controller – Thin
import * as groupService from "../services/groupService.js";

export const getGroups = async (req, res, next) => {
  try {
    const groups = await groupService.getGroups(req.user);
    res.status(200).json({ success: true, count: groups.length, data: groups });
  } catch (error) { next(error); }
};

export const getGroupById = async (req, res, next) => {
  try {
    const group = await groupService.getGroupById(parseInt(req.params.groupId));
    res.status(200).json({ success: true, data: group });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const group = await groupService.createGroup(req.body);
    res.status(201).json({ success: true, message: "Group created successfully", data: group });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const group = await groupService.updateGroup(parseInt(req.params.groupId), req.body);
    res.status(200).json({ success: true, message: "Group updated successfully", data: group });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    await groupService.deleteGroup(parseInt(req.params.groupId));
    res.status(200).json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};
