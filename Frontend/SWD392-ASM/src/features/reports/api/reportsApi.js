// features/reports/api/reportsApi.js
// Contribution Reporting API
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

export const getReportsApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.REPORTS.BASE(groupId));

export const generateReportApi = (groupId) =>
  axiosClient.post(API_ENDPOINTS.REPORTS.GENERATE(groupId));

export const getMyReportApi = (groupId) =>
  axiosClient.get(API_ENDPOINTS.REPORTS.ME(groupId));
