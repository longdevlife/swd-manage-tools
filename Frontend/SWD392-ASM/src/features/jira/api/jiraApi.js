// features/jira/api/jiraApi.js
// Jira Integration API — config, sync, issues, status, assign
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

// ── Config ───────────────────────────────────────────────
export const getJiraConfigApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.JIRA.CONFIG(groupId));

export const configureJiraApi = (groupId, data) =>
  axiosClient.post(API_ENDPOINTS.JIRA.CONFIG(groupId), data);

// ── Sync ─────────────────────────────────────────────────
export const syncJiraIssuesApi = (groupId) =>
  axiosClient.post(API_ENDPOINTS.JIRA.SYNC(groupId));

// ── Issues ───────────────────────────────────────────────
export const getJiraIssuesApi = (groupId, params) =>
  axiosClient.get(API_ENDPOINTS.JIRA.ISSUES(groupId), { params });

// ── Status Update (Flow 2) ──────────────────────────────
export const updateIssueStatusApi = (groupId, issueId, data) =>
  axiosClient.put(API_ENDPOINTS.JIRA.ISSUE_STATUS(groupId, issueId), data);

// ── Assign Issue (Flow 1) ───────────────────────────────
export const assignIssueApi = (groupId, issueId, data) =>
  axiosClient.put(API_ENDPOINTS.JIRA.ISSUE_ASSIGN(groupId, issueId), data);
