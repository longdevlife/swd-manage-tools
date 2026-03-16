// features/reports/hooks/useReports.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getReportsApi, generateReportApi, getMyReportApi } from '../api/reportsApi';

import { QUERY_KEYS } from '@/config/constants';

export function useReports(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS.ALL(groupId),
    queryFn: () => getReportsApi(groupId),
    enabled: !!groupId,
  });
}

export function useMyReport(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS.ME(groupId),
    queryFn: () => getMyReportApi(groupId),
    enabled: !!groupId,
  });
}

export function useGenerateReport(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateReportApi(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL(groupId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ME(groupId) });
      toast.success('Báo cáo đã được tạo thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Tạo báo cáo thất bại'),
  });
}
