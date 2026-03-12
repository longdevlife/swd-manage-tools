import axiosClient from './axiosClient';

/**
 * Leader API Service — Task Management + Reports
 * Tạm dùng mock data, sẵn sàng kết nối API khi BE xong.
 */

export const leaderService = {
    // ─── Tasks ──────────────────────────────────────────
    getTasks: () => axiosClient.get('/api/leader/tasks'),
    getTaskById: (id) => axiosClient.get(`/api/leader/tasks/${id}`),
    createTask: (data) => axiosClient.post('/api/leader/tasks', data),
    updateTask: (id, data) => axiosClient.put(`/api/leader/tasks/${id}`, data),
    deleteTask: (id) => axiosClient.delete(`/api/leader/tasks/${id}`),
    assignTask: (taskId, memberId) =>
        axiosClient.put(`/api/leader/tasks/${taskId}/assign`, { memberId }),
    updateTaskStatus: (taskId, status) =>
        axiosClient.patch(`/api/leader/tasks/${taskId}/status`, { status }),

    // ─── Members ────────────────────────────────────────
    getMembers: () => axiosClient.get('/api/leader/members'),

    // ─── Reports & Commits ─────────────────────────────
    getCommitSummary: () => axiosClient.get('/api/leader/commits/summary'),
    generateReport: () => axiosClient.post('/api/leader/reports/generate'),
    getProgressReport: () => axiosClient.get('/api/leader/reports/progress'),
};
