// Member Service – Business logic
import * as memberRepo from "../repositories/memberRepository.js";

export const getMembers = (groupId) => memberRepo.findMembersByGroup(groupId);

export const addMember = async (groupId, userId) => {
  if (!userId) {
    const err = new Error("user_id is required");
    err.statusCode = 400;
    throw err;
  }

  const group = await memberRepo.findGroupById(groupId);
  if (!group) { const err = new Error("Group not found"); err.statusCode = 404; throw err; }

  const user = await memberRepo.findUserById(parseInt(userId));
  if (!user) { const err = new Error("User not found"); err.statusCode = 404; throw err; }

  const existing = await memberRepo.findMember(groupId, parseInt(userId));
  if (existing) {
    const err = new Error("User is already a member of this group");
    err.statusCode = 400;
    throw err;
  }

  return memberRepo.createMember(groupId, parseInt(userId));
};

export const removeMember = async (groupId, userId) => {
  const existing = await memberRepo.findMember(groupId, userId);
  if (!existing) {
    const err = new Error("Member not found in this group");
    err.statusCode = 404;
    throw err;
  }

  // Nếu đang là leader → xóa luôn leader
  const leader = await memberRepo.findLeader(groupId);
  if (leader && leader.user_id === userId) {
    await memberRepo.deleteLeader(groupId);
  }

  await memberRepo.deleteMember(groupId, userId);
};

export const getLeader = (groupId) => memberRepo.findLeader(groupId);

export const assignLeader = async (groupId, userId) => {
  if (!userId) {
    const err = new Error("user_id is required");
    err.statusCode = 400;
    throw err;
  }

  const isMember = await memberRepo.findMember(groupId, parseInt(userId));
  if (!isMember) {
    const err = new Error("User must be a member of the group before being assigned as leader");
    err.statusCode = 400;
    throw err;
  }

  return memberRepo.upsertLeader(groupId, parseInt(userId));
};
