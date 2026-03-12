import axiosClient from './axiosClient';

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = (role) =>
  axiosClient.get('/users', {
    params: role && role !== 'ALL' ? { role } : {},
  });

// ─── Groups ───────────────────────────────────────────────────────────────────
export const getAllGroups = () => axiosClient.get('/groups');

export const createGroup = (data) => axiosClient.post('/groups', data);

export const deleteGroup = (groupId) => axiosClient.delete(`/groups/${groupId}`);

export const addMember = (groupId, userId) =>
  axiosClient.put(`/groups/${groupId}/member/${userId}`);

export const removeMember = (groupId, userId) =>
  axiosClient.delete(`/groups/${groupId}/member/${userId}`);

export const assignLeader = (groupId, leaderId) =>
  axiosClient.put(`/groups/${groupId}/leader/${leaderId}`);

export const removeLecturer = (groupId) => axiosClient.delete(`/groups/${groupId}/lecturer`);

// ─── Group Requests ─────────────────────────────────────────────────────────
export const getGroupRequests = () => axiosClient.get('/admin/group-requests');

export const approveRequest = (id) => axiosClient.post(`/admin/group-requests/${id}/approve`);

export const rejectRequest = (id) => axiosClient.post(`/admin/group-requests/${id}/reject`);

// ─── Jira ────────────────────────────────────────────────────────────────────
export const createJiraProject = (groupId, data) =>
  axiosClient.post(`/admin/groups/${groupId}/jira-project`, data);

export const testJiraConnection = () => axiosClient.get('/jira/test');
