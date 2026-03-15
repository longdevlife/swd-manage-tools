// features/groups/api/groupsApi.js
// Group Management API — CRUD groups + members + lecturers
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

// ── Groups CRUD ──────────────────────────────────────────
export const getGroupsApi = (params) =>
  axiosClient.get(API_ENDPOINTS.GROUPS.BASE, { params });

export const getGroupByIdApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.GROUPS.DETAIL(groupId));

export const createGroupApi = (data) =>
  axiosClient.post(API_ENDPOINTS.GROUPS.BASE, data);

export const updateGroupApi = (groupId, data) =>
  axiosClient.put(API_ENDPOINTS.GROUPS.DETAIL(groupId), data);

export const deleteGroupApi = (groupId) =>
  axiosClient.delete(API_ENDPOINTS.GROUPS.DETAIL(groupId));

// ── Members ──────────────────────────────────────────────
export const getMembersApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.GROUPS.MEMBERS(groupId));

export const addMemberApi = (groupId, data) =>
  axiosClient.post(API_ENDPOINTS.GROUPS.MEMBERS(groupId), data);

export const removeMemberApi = (groupId, userId) =>
  axiosClient.delete(API_ENDPOINTS.GROUPS.MEMBER(groupId, userId));

// ── Leader ───────────────────────────────────────────────
export const getLeaderApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.GROUPS.LEADER(groupId));

export const assignLeaderApi = (groupId, data) =>
  axiosClient.put(API_ENDPOINTS.GROUPS.LEADER(groupId), data);

// ── Lecturers ────────────────────────────────────────────
export const getLecturersApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.GROUPS.LECTURERS(groupId));

export const assignLecturerApi = (groupId, data) =>
  axiosClient.post(API_ENDPOINTS.GROUPS.LECTURERS(groupId), data);

export const removeLecturerApi = (groupId, lecturerId) =>
  axiosClient.delete(API_ENDPOINTS.GROUPS.LECTURER(groupId, lecturerId));
