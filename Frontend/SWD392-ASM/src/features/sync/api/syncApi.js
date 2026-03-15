// features/sync/api/syncApi.js
// Manual Sync API — Flow 3 hoàn chỉnh
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

export const manualSyncApi = (groupId) =>
  axiosClient.post(API_ENDPOINTS.SYNC.MANUAL(groupId));
