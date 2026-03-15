// features/users/hooks/useUsers.js
import { useQuery } from '@tanstack/react-query';

import { getUsersApi, getUserByIdApi } from '../api/usersApi';

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
