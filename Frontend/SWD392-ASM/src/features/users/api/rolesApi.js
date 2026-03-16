// features/users/api/rolesApi.js
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

export const getRolesApi = () => axiosClient.get(API_ENDPOINTS.ROLES.BASE);
