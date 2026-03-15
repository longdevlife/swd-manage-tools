// features/auth/api/authApi.js
// Auth API — login, register, me, google oauth
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

export const loginApi = (credentials) =>
  axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);

export const registerApi = (data) =>
  axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, data);

export const getMeApi = () =>
  axiosClient.get(API_ENDPOINTS.AUTH.ME);

export const getGoogleLoginUrl = () =>
  `${axiosClient.defaults.baseURL}${API_ENDPOINTS.AUTH.GOOGLE}`;
