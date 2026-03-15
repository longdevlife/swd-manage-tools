// features/auth/hooks/useAuth.js
// React Query hooks cho Auth
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

import { loginApi, registerApi, getMeApi } from '../api/authApi';

import { QUERY_KEYS } from '@/config/constants';
import { setCredentials, logout } from '@/stores/authSlice';

export function useLogin() {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      dispatch(setCredentials({ user: data.data.user, token: data.data.token }));
      toast.success('Đăng nhập thành công!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    },
  });
}

export function useRegister() {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      dispatch(setCredentials({ user: data.data.user, token: data.data.token }));
      toast.success('Đăng ký thành công!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn: getMeApi,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

export function useLogout() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  return () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    dispatch(logout());
    queryClient.clear();
    toast.info('Đã đăng xuất');
  };
}
