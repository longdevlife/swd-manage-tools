// features/jira/hooks/useJira.js
// React Query hooks cho Jira Integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getJiraConfigApi, configureJiraApi, syncJiraIssuesApi,
  getJiraIssuesApi, updateIssueStatusApi, assignIssueApi,
} from '../api/jiraApi';

import { QUERY_KEYS } from '@/config/constants';

// ── Config ───────────────────────────────────────────────
export function useJiraConfig(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.JIRA.CONFIG(groupId),
    queryFn: () => getJiraConfigApi(groupId),
    enabled: !!groupId,
    retry: false,
  });
}

export function useConfigureJira(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => configureJiraApi(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JIRA.CONFIG(groupId) });
      toast.success('Cấu hình Jira thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cấu hình Jira thất bại'),
  });
}

// ── Sync ─────────────────────────────────────────────────
export function useSyncJira(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncJiraIssuesApi(groupId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JIRA.ALL(groupId) });
      const result = data.data || data;
      toast.success(`Sync thành công: ${result.created || 0} mới, ${result.updated || 0} cập nhật`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Sync Jira thất bại'),
  });
}

// ── Issues ───────────────────────────────────────────────
export function useJiraIssues(groupId, filters) {
  return useQuery({
    queryKey: QUERY_KEYS.JIRA.ISSUES(groupId, filters),
    queryFn: () => getJiraIssuesApi(groupId, filters),
    enabled: !!groupId,
  });
}

// ── Status Update (Flow 2) ──────────────────────────────
export function useUpdateIssueStatus(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }) => updateIssueStatusApi(groupId, issueId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JIRA.ALL(groupId) });
      toast.success('Cập nhật trạng thái thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });
}

// ── Assign Issue (Flow 1) ───────────────────────────────
export function useAssignIssue(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, assignee_email }) =>
      assignIssueApi(groupId, issueId, { assignee_email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JIRA.ALL(groupId) });
      toast.success('Gán task thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gán task thất bại'),
  });
}
