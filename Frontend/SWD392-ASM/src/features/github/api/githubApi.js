// features/github/api/githubApi.js
// GitHub Integration API — config, sync, commits, stats
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

// ── Config ───────────────────────────────────────────────
export const getGitHubConfigApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.GITHUB.CONFIG(groupId));

export const configureGitHubApi = (groupId, data) =>
  axiosClient.post(API_ENDPOINTS.GITHUB.CONFIG(groupId), data);

// ── Sync ─────────────────────────────────────────────────
export const syncCommitsApi = (groupId) =>
  axiosClient.post(API_ENDPOINTS.GITHUB.SYNC(groupId));

// ── Commits ──────────────────────────────────────────────
export const getCommitsApi = (groupId, params) =>
  axiosClient.get(API_ENDPOINTS.GITHUB.COMMITS(groupId), { params });

// ── Stats ────────────────────────────────────────────────
export const getCommitStatsApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.GITHUB.COMMIT_STATS(groupId));
