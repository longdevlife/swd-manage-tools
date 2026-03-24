// Member Controller – Thin
import * as memberService from "../services/memberService.js";

export const getMembers = async (req, res, next) => {
  try {
    const members = await memberService.getMembers(parseInt(req.params.groupId));
    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (error) { next(error); }
};

export const addMember = async (req, res, next) => {
  try {
    const member = await memberService.addMember(parseInt(req.params.groupId), req.body.user_id);
    res.status(201).json({ success: true, message: "Member added successfully", data: member });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    await memberService.removeMember(parseInt(req.params.groupId), parseInt(req.params.userId));
    res.status(200).json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const getLeader = async (req, res, next) => {
  try {
    const leader = await memberService.getLeader(parseInt(req.params.groupId));
    if (!leader) return res.status(200).json({ success: true, message: "No leader assigned yet", data: null });
    res.status(200).json({ success: true, data: leader });
  } catch (error) { next(error); }
};

export const assignLeader = async (req, res, next) => {
  try {
    const leader = await memberService.assignLeader(parseInt(req.params.groupId), req.body.user_id);
    res.status(200).json({ success: true, message: "Leader assigned successfully", data: leader });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};
