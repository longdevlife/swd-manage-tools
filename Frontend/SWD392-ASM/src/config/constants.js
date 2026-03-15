// ═══════════════════════════════════════════════════════════
// constants.js — API Endpoints, Query Keys, Roles
// Map 1:1 với backend routes (10 phases)
// ═══════════════════════════════════════════════════════════

// ── API ENDPOINTS ─────────────────────────────────────────
// axiosClient.baseURL đã bao gồm /api
// Nên paths ở đây KHÔNG có prefix /api
export const API_ENDPOINTS = {
  // Phase 4: Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
  },

  // Phase 6: Group Management
  GROUPS: {
    BASE: '/groups',
    DETAIL: (groupId) => `/groups/${groupId}`,
    MEMBERS: (groupId) => `/groups/${groupId}/members`,
    MEMBER: (groupId, userId) => `/groups/${groupId}/members/${userId}`,
    LEADER: (groupId) => `/groups/${groupId}/members/leader`,
    LECTURERS: (groupId) => `/groups/${groupId}/lecturers`,
    LECTURER: (groupId, lecturerId) => `/groups/${groupId}/lecturers/${lecturerId}`,
  },

  // Phase 7: Jira Integration
  JIRA: {
    CONFIG: (groupId) => `/groups/${groupId}/jira`,
    SYNC: (groupId) => `/groups/${groupId}/jira/sync`,
    ISSUES: (groupId) => `/groups/${groupId}/jira/issues`,
    ISSUE_STATUS: (groupId, issueId) => `/groups/${groupId}/jira/issues/${issueId}/status`,
    ISSUE_ASSIGN: (groupId, issueId) => `/groups/${groupId}/jira/issues/${issueId}/assign`,
  },

  // Phase 8: GitHub Integration
  GITHUB: {
    CONFIG: (groupId) => `/groups/${groupId}/github`,
    SYNC: (groupId) => `/groups/${groupId}/github/sync`,
    COMMITS: (groupId) => `/groups/${groupId}/github/commits`,
    COMMIT_STATS: (groupId) => `/groups/${groupId}/github/commits/stats`,
  },

  // Phase 9: Contribution Reports
  REPORTS: {
    BASE: (groupId) => `/groups/${groupId}/reports`,
    GENERATE: (groupId) => `/groups/${groupId}/reports/generate`,
    ME: (groupId) => `/groups/${groupId}/reports/me`,
  },

  // Phase 10: Manual Sync
  SYNC: {
    MANUAL: (groupId) => `/groups/${groupId}/sync`,
  },

  // Users (Admin)
  USERS: {
    BASE: '/users',
    DETAIL: (userId) => `/users/${userId}`,
  },
};

// ── REACT QUERY KEYS ──────────────────────────────────────
// Dùng cho useQuery queryKey — đảm bảo cache invalidation đúng
export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'],
  },
  GROUPS: {
    ALL: ['groups'],
    LIST: (filters) => ['groups', 'list', filters],
    DETAIL: (groupId) => ['groups', groupId],
    MEMBERS: (groupId) => ['groups', groupId, 'members'],
    LEADER: (groupId) => ['groups', groupId, 'leader'],
    LECTURERS: (groupId) => ['groups', groupId, 'lecturers'],
  },
  JIRA: {
    ALL: (groupId) => ['jira', groupId],
    CONFIG: (groupId) => ['jira', groupId, 'config'],
    ISSUES: (groupId, filters) => ['jira', groupId, 'issues', filters],
  },
  GITHUB: {
    ALL: (groupId) => ['github', groupId],
    CONFIG: (groupId) => ['github', groupId, 'config'],
    COMMITS: (groupId, filters) => ['github', groupId, 'commits', filters],
    STATS: (groupId) => ['github', groupId, 'stats'],
  },
  REPORTS: {
    ALL: (groupId) => ['reports', groupId],
    ME: (groupId) => ['reports', groupId, 'me'],
  },
  USERS: {
    ALL: ['users'],
    LIST: (filters) => ['users', 'list', filters],
    DETAIL: (userId) => ['users', userId],
  },
};

// ── ROLES ─────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'ADMIN',
  LECTURER: 'LECTURER',
  LEADER: 'LEADER',
  MEMBER: 'MEMBER',
};

// ── JIRA STATUS COLORS ───────────────────────────────────
export const JIRA_STATUS_COLORS = {
  'To Do': 'secondary',
  'In Progress': 'default',
  'In Review': 'outline',
  'Done': 'success',
  'Closed': 'success',
  'Resolved': 'success',
  'Blocked': 'destructive',
};

// ── PRIORITY COLORS ──────────────────────────────────────
export const PRIORITY_COLORS = {
  Highest: 'destructive',
  High: 'destructive',
  Medium: 'warning',
  Low: 'secondary',
  Lowest: 'outline',
};
