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

// Google OAuth: redirect trực tiếp đến backend passport route
// axiosClient.baseURL = /api, nhưng đây là window.location.href nên cần full path
export const getGoogleLoginUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  return `${baseUrl}/auth/google`;
};

// Exchange code for token (nếu backend trả code thay vì redirect trực tiếp)
export const handleGoogleCallback = (code) =>
  axiosClient.get(`${API_ENDPOINTS.AUTH.GOOGLE_CALLBACK}?code=${code}`);
