// features/users/api/usersApi.js
// User Management API (Admin only)
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

export const getUsersApi = (params) => axiosClient.get(API_ENDPOINTS.USERS.BASE, { params });

export const getUserByIdApi = (userId) => axiosClient.get(API_ENDPOINTS.USERS.DETAIL(userId));

export const updateUserProfileApi = (userId, data) =>
  axiosClient.put(API_ENDPOINTS.USERS.DETAIL(userId), data);

export const createUserApi = (data) => axiosClient.post(API_ENDPOINTS.USERS.BASE, data);

export const deactivateUserApi = (userId) =>
  axiosClient.patch(API_ENDPOINTS.USERS.DEACTIVATE(userId));

export const updateUserRolesApi = (userId, roles) =>
  axiosClient.put(API_ENDPOINTS.USERS.ROLES(userId), { roles });
