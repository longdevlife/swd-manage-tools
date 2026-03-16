// features/groups/hooks/useGroups.js
// React Query hooks cho Group Management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getGroupsApi, getGroupByIdApi, createGroupApi, updateGroupApi, deleteGroupApi,
  getMembersApi, addMemberApi, removeMemberApi,
  getLeaderApi, assignLeaderApi,
  getLecturersApi, assignLecturerApi, removeLecturerApi,
} from '../api/groupsApi';

import { QUERY_KEYS } from '@/config/constants';

// ── Groups ───────────────────────────────────────────────
export function useGroups(filters) {
  return useQuery({
    queryKey: QUERY_KEYS.GROUPS.LIST(filters),
    queryFn: () => getGroupsApi(filters),
  });
}

export function useGroupDetail(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.GROUPS.DETAIL(groupId),
    queryFn: () => getGroupByIdApi(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroupApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.ALL });
      toast.success('Tạo nhóm thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Tạo nhóm thất bại'),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }) => updateGroupApi(groupId, data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.DETAIL(groupId) });
      toast.success('Cập nhật nhóm thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGroupApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.ALL });
      toast.success('Xóa nhóm thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Xóa nhóm thất bại'),
  });
}

// ── Members ──────────────────────────────────────────────
export function useMembers(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.GROUPS.MEMBERS(groupId),
    queryFn: () => getMembersApi(groupId),
    enabled: !!groupId,
  });
}

export function useAddMember(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => addMemberApi(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.MEMBERS(groupId) });
      toast.success('Thêm thành viên thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thêm thành viên thất bại'),
  });
}

export function useRemoveMember(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => removeMemberApi(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.MEMBERS(groupId) });
      toast.success('Xóa thành viên thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Xóa thành viên thất bại'),
  });
}

// ── Leader ───────────────────────────────────────────────
export function useLeader(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.GROUPS.LEADER(groupId),
    queryFn: () => getLeaderApi(groupId),
    enabled: !!groupId,
  });
}

export function useAssignLeader(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => assignLeaderApi(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.LEADER(groupId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.MEMBERS(groupId) });
      toast.success('Gán leader thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gán leader thất bại'),
  });
}

// ── Lecturers ────────────────────────────────────────────
export function useLecturers(groupId) {
  return useQuery({
    queryKey: QUERY_KEYS.GROUPS.LECTURERS(groupId),
    queryFn: () => getLecturersApi(groupId),
    enabled: !!groupId,
  });
}

export function useAssignLecturer(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => assignLecturerApi(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.LECTURERS(groupId) });
      toast.success('Gán giảng viên thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thất bại'),
  });
}

export function useRemoveLecturer(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lecturerId) => removeLecturerApi(groupId, lecturerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.LECTURERS(groupId) });
      toast.success('Xóa giảng viên thành công!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thất bại'),
  });
}
