// features/users/hooks/useRoles.js
import { useQuery } from '@tanstack/react-query';
import { getRolesApi } from '../api/rolesApi';
import { QUERY_KEYS } from '@/config/constants';

export function useRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES.ALL,
    queryFn: getRolesApi,
  });
}
