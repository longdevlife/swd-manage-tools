// features/users/api/usersApi.js
// User Management API (Admin only)
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

export const getUsersApi = (params) =>
  axiosClient.get(API_ENDPOINTS.USERS.BASE, { params });

export const getUserByIdApi = (userId) =>
  axiosClient.get(API_ENDPOINTS.USERS.DETAIL(userId));
