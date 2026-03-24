// Group Service – Business logic
import * as groupRepo from "../repositories/groupRepository.js";

export const getGroups = async (user) => {
  if (user.roles.includes("ADMIN")) return groupRepo.findAllGroups();
  if (user.roles.includes("LECTURER")) return groupRepo.findGroupsByLecturer(user.user_id);
  return groupRepo.findGroupsByMember(user.user_id);
};

export const getGroupById = async (groupId) => {
  const group = await groupRepo.findGroupById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }
  return group;
};

export const createGroup = async ({ group_name, semester, project_title }) => {
  if (!group_name || !semester || !project_title) {
    const err = new Error("group_name, semester, and project_title are required");
    err.statusCode = 400;
    throw err;
  }
  return groupRepo.createGroup({ group_name, semester, project_title });
};

export const updateGroup = async (groupId, data) => {
  const existing = await groupRepo.findGroupByIdSimple(groupId);
  if (!existing) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }
  const updateData = {};
  if (data.group_name) updateData.group_name = data.group_name;
  if (data.semester) updateData.semester = data.semester;
  if (data.project_title) updateData.project_title = data.project_title;
  return groupRepo.updateGroup(groupId, updateData);
};

export const deleteGroup = async (groupId) => {
  const existing = await groupRepo.findGroupByIdSimple(groupId);
  if (!existing) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }
  await groupRepo.deleteGroup(groupId);
};
