// features/sync/hooks/useSync.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { manualSyncApi } from '../api/syncApi';

import { QUERY_KEYS } from '@/config/constants';

export function useSyncGroup(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => manualSyncApi(groupId),
    onSuccess: (data) => {
      // Invalidate tất cả data liên quan sau sync
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JIRA.ALL(groupId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GITHUB.ALL(groupId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL(groupId) });

      const result = data.data || data;
      const hasErrors = result.errors && result.errors.length > 0;

      if (hasErrors) {
        toast.warning('Sync hoàn tất nhưng có cảnh báo', {
          description: result.errors.map((e) => `${e.step}: ${e.message}`).join(', '),
        });
      } else {
        toast.success('Sync hoàn tất!', {
          description: `Jira: ${result.jira?.created || 0} mới | GitHub: ${result.github?.created || 0} commits | Reports: ${result.reports?.members_processed || 0} members`,
        });
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Sync thất bại'),
  });
}
