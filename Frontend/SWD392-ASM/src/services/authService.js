import axiosClient from './axiosClient';

/**
 * Auth & Profile API service — Google OAuth (qua Vite proxy)
 */

export const authService = {
    // URL tương đối — Vite proxy forward sang backend
    getGoogleLoginUrl: () => '/oauth2/authorization/google',

    // Profile
    getProfile: () => axiosClient.get('/api/auth/profile'),
    updateProfile: (data) => axiosClient.put('/api/auth/profile', data),
};
