// features/users/hooks/useUsers.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getUsersApi,
  getUserByIdApi,
  createUserApi,
  updateUserProfileApi,
  deactivateUserApi,
  updateUserRolesApi,
} from '../api/usersApi';

import { QUERY_KEYS } from '@/config/constants';

export function useUsers(filters) {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.LIST(filters),
    queryFn: () => getUsersApi(filters),
  });
}

export function useUserDetail(userId) {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.DETAIL(userId),
    queryFn: () => getUserByIdApi(userId),
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('Tạo người dùng thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Tạo người dùng thất bại'),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }) => updateUserProfileApi(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(userId) });
      toast.success('Cập nhật thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('Vô hiệu hoá tài khoản thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Vô hiệu hoá thất bại'),
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roles }) => updateUserRolesApi(userId, roles),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(userId) });
      toast.success('Cập nhật roles thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cập nhật roles thất bại'),
  });
}
