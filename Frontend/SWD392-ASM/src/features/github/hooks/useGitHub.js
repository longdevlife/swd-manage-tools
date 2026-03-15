// features/github/hooks/useGitHub.js
// React Query hooks cho GitHub Integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getGitHubConfigApi, configureGitHubApi,
  syncCommitsApi, getCommitsApi, getCommitStatsApi,
} from '../api/githubApi';

import { QUERY_KEYS } from '@/config/constants';

// ── Config ───────────────────────────────────────────────
export function useGitHubConfig(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.GITHUB.CONFIG(groupId),
    queryFn: () => getGitHubConfigApi(groupId),
    enabled: !!groupId,
    retry: false,
  });
}

export function useConfigureGitHub(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => configureGitHubApi(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GITHUB.CONFIG(groupId) });
      toast.success('Cấu hình GitHub thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cấu hình GitHub thất bại'),
  });
}

// ── Sync ─────────────────────────────────────────────────
export function useSyncCommits(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncCommitsApi(groupId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GITHUB.ALL(groupId) });
      const result = data.data || data;
      toast.success(`Sync thành công: ${result.created || 0} commits mới`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Sync GitHub thất bại'),
  });
}

// ── Commits ──────────────────────────────────────────────
export function useCommits(groupId, filters) {
  return useQuery({
    queryKey: QUERY_KEYS.GITHUB.COMMITS(groupId, filters),
    queryFn: () => getCommitsApi(groupId, filters),
    enabled: !!groupId,
  });
}

// ── Stats ────────────────────────────────────────────────
export function useCommitStats(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.GITHUB.STATS(groupId),
    queryFn: () => getCommitStatsApi(groupId),
    enabled: !!groupId,
  });
}
