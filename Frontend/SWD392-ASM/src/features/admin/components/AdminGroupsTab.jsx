import { Fragment, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Crown,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { normalizeGroup, normalizeUser } from '../utils/adminMappers';

import { AdminGroupFormDialog } from './AdminGroupFormDialog';
import { AdminRoleBadge } from './AdminRoleBadge';
import { AdminTableSkeleton } from './AdminTableSkeleton';

import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QUERY_KEYS } from '@/config/constants';
import { configureJiraApi } from '@/features/jira';
import {
  addMemberApi,
  assignLeaderApi,
  assignLecturerApi,
  createGroupApi,
  deleteGroupApi,
  removeLecturerApi,
  removeMemberApi,
  updateGroupApi,
  useGroupDetail,
  useGroups,
  useLeader,
  useLecturers,
} from '@/features/groups';
import { useUsers } from '@/features/users';

const DEFAULT_GROUP_FORM = {
  groupName: '',
  semester: '',
  projectTitle: '',
  leaderId: '',
  lecturerId: '',
  memberIds: [],
};

const DEFAULT_JIRA_FORM = {
  projectKey: '',
  projectName: '',
  baseUrl: '',
  jiraEmail: '',
  jiraApiToken: '',
};

export function AdminGroupsTab() {
  const queryClient = useQueryClient();
  const groupsQuery = useGroups();
  const usersQuery = useUsers();

  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [assignLeaderOpen, setAssignLeaderOpen] = useState(false);
  const [assignLecturerOpen, setAssignLecturerOpen] = useState(false);
  const [jiraOpen, setJiraOpen] = useState(false);
  const [groupForm, setGroupForm] = useState(DEFAULT_GROUP_FORM);
  const [editingGroup, setEditingGroup] = useState(null);
  const [targetGroup, setTargetGroup] = useState(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [assignLeaderUserId, setAssignLeaderUserId] = useState('');
  const [assignLecturerUserId, setAssignLecturerUserId] = useState('');
  const [jiraForm, setJiraForm] = useState(DEFAULT_JIRA_FORM);

  const groupDetailQuery = useGroupDetail(expandedGroupId);
  const leaderQuery = useLeader(expandedGroupId);
  const lecturersQuery = useLecturers(expandedGroupId);
  const targetLecturersQuery = useLecturers(assignLecturerOpen ? targetGroup?.groupId : null);

  const groups = Array.isArray(groupsQuery.data?.data)
    ? groupsQuery.data.data.map(normalizeGroup)
    : [];
  const users = Array.isArray(usersQuery.data?.data) ? usersQuery.data.data.map(normalizeUser) : [];

  const availableMembers = users.filter(
    (user) => !['ROLE_ADMIN', 'ROLE_LECTURER'].includes(user.role),
  );
  const availableLecturers = users.filter((user) => user.role === 'ROLE_LECTURER');
  const expandedGroup = groups.find((group) => group.groupId === expandedGroupId) ?? null;
  const groupDetail = groupDetailQuery.data?.data
    ? normalizeGroup(groupDetailQuery.data.data)
    : expandedGroup;
  const leaderDetail = leaderQuery.data?.data ?? null;
  const lecturerAssignments = Array.isArray(lecturersQuery.data?.data)
    ? lecturersQuery.data.data
    : [];
  const targetLecturerAssignments = Array.isArray(targetLecturersQuery.data?.data)
    ? targetLecturersQuery.data.data
    : [];

  const createGroupMutation = useMutation({
    mutationFn: createGroupApi,
  });
  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }) => updateGroupApi(groupId, data),
    onSuccess: () => {
      toast.success('Cập nhật nhóm thành công');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Cập nhật nhóm thất bại');
    },
  });
  const deleteGroupMutation = useMutation({
    mutationFn: deleteGroupApi,
    onSuccess: () => {
      toast.success('Xoá nhóm thành công');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xoá nhóm thất bại');
    },
  });
  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }) => addMemberApi(groupId, { user_id: userId }),
    onSuccess: () => {
      toast.success('Thêm thành viên thành công');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Thêm thành viên thất bại');
    },
  });
  const assignLeaderMutation = useMutation({
    mutationFn: ({ groupId, userId }) => assignLeaderApi(groupId, { user_id: userId }),
    onSuccess: () => {
      toast.success('Gán leader thành công');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gán leader thất bại');
    },
  });
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }) => removeMemberApi(groupId, userId),
    onSuccess: () => {
      toast.success('Đã xoá thành viên khỏi nhóm');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xoá thành viên thất bại');
    },
  });
  const assignLecturerMutation = useMutation({
    mutationFn: ({ groupId, lecturerId }) =>
      assignLecturerApi(groupId, { lecturer_id: lecturerId }),
    onSuccess: () => {
      toast.success('Đã gán giảng viên cho nhóm');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gán giảng viên thất bại');
    },
  });
  const removeLecturerMutation = useMutation({
    mutationFn: ({ groupId, lecturerId }) => removeLecturerApi(groupId, lecturerId),
    onSuccess: () => {
      toast.success('Đã xoá giảng viên khỏi nhóm');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xoá giảng viên thất bại');
    },
  });
  const createJiraMutation = useMutation({
    mutationFn: ({ groupId, data }) => configureJiraApi(groupId, data),
    onSuccess: () => {
      toast.success('Tạo dự án Jira thành công');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Tạo dự án Jira thất bại');
    },
  });

  const selectableMembers = targetGroup
    ? availableMembers.filter(
        (user) => !(targetGroup.members ?? []).some((member) => member.userId === user.userId),
      )
    : availableMembers;
  const selectedMembersForLeader = targetGroup?.members ?? [];
  const selectableLecturers = availableLecturers.filter(
    (lecturer) =>
      !targetLecturerAssignments.some((assignment) => assignment.lecturer_id === lecturer.userId),
  );

  const openCreateDialog = () => {
    setEditingGroup(null);
    setGroupForm(DEFAULT_GROUP_FORM);
    setCreateOpen(true);
  };

  const openEditDialog = (group) => {
    setEditingGroup(group);
    setGroupForm({
      groupName: group.groupName,
      semester: group.semester,
      projectTitle: group.projectTitle,
      leaderId: group.teamLeader?.userId ? String(group.teamLeader.userId) : '',
      lecturerId: group.lecturer?.userId ? String(group.lecturer.userId) : '',
      memberIds: group.members.map((member) => String(member.userId)),
    });
    setEditOpen(true);
  };

  const handleToggleExpand = (groupId) => {
    setExpandedGroupId((current) => (current === groupId ? null : groupId));
  };

  const handleToggleMemberSelect = (userId) => {
    const normalizedUserId = String(userId);
    setGroupForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(normalizedUserId)
        ? prev.memberIds.filter((id) => id !== normalizedUserId)
        : [...prev.memberIds, normalizedUserId],
    }));
  };

  const handleCreateGroup = async () => {
    if (!groupForm.groupName.trim()) {
      toast.error('Tên nhóm không được để trống');
      return;
    }

    const selectedMemberIds = new Set(groupForm.memberIds.map((id) => Number(id)));
    if (groupForm.leaderId) {
      selectedMemberIds.add(Number(groupForm.leaderId));
    }

    try {
      const created = await createGroupMutation.mutateAsync({
        group_name: groupForm.groupName.trim(),
        semester: groupForm.semester.trim() || 'SWD392',
        project_title: groupForm.projectTitle.trim() || groupForm.groupName.trim(),
      });

      const groupId = created?.data?.group_id;
      if (!groupId) {
        throw new Error('Không lấy được ID nhóm sau khi tạo');
      }

      for (const userId of selectedMemberIds) {
        await addMemberApi(groupId, { user_id: userId });
      }

      if (groupForm.leaderId) {
        await assignLeaderApi(groupId, {
          user_id: Number(groupForm.leaderId),
        });
      }

      if (groupForm.lecturerId) {
        await assignLecturerApi(groupId, {
          lecturer_id: Number(groupForm.lecturerId),
        });
      }

      await refreshGroupQueries(groupId, queryClient);
      setCreateOpen(false);
      setGroupForm(DEFAULT_GROUP_FORM);
      toast.success('Đã tạo nhóm và đồng bộ thành viên thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Tạo nhóm thất bại');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    if (!groupForm.groupName.trim()) {
      toast.error('Tên nhóm không được để trống');
      return;
    }

    try {
      await updateGroupMutation.mutateAsync({
        groupId: editingGroup.groupId,
        data: {
          group_name: groupForm.groupName.trim(),
          semester: groupForm.semester.trim(),
          project_title: groupForm.projectTitle.trim(),
        },
      });
      await refreshGroupQueries(editingGroup.groupId, queryClient);
      setEditOpen(false);
      setEditingGroup(null);
    } catch {
      // handled by mutation toast
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Xoá nhóm "${group.groupName}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      await deleteGroupMutation.mutateAsync(group.groupId);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.ALL });
      if (expandedGroupId === group.groupId) {
        setExpandedGroupId(null);
      }
    } catch {
      // handled by mutation toast
    }
  };

  const handleAddMember = async () => {
    if (!targetGroup?.groupId || !addMemberUserId) {
      toast.error('Vui lòng chọn người dùng');
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        groupId: targetGroup.groupId,
        userId: Number(addMemberUserId),
      });
      await refreshGroupQueries(targetGroup.groupId, queryClient);
      setAddMemberUserId('');
      setAddMemberOpen(false);
    } catch {
      // handled by mutation toast
    }
  };

  const handleAssignLeader = async () => {
    if (!targetGroup?.groupId || !assignLeaderUserId) {
      toast.error('Vui lòng chọn thành viên');
      return;
    }

    try {
      await assignLeaderMutation.mutateAsync({
        groupId: targetGroup.groupId,
        userId: Number(assignLeaderUserId),
      });
      await refreshGroupQueries(targetGroup.groupId, queryClient);
      setAssignLeaderUserId('');
      setAssignLeaderOpen(false);
    } catch {
      // handled by mutation toast
    }
  };

  const handleAssignLecturer = async () => {
    if (!targetGroup?.groupId || !assignLecturerUserId) {
      toast.error('Vui lòng chọn giảng viên');
      return;
    }

    try {
      await assignLecturerMutation.mutateAsync({
        groupId: targetGroup.groupId,
        lecturerId: Number(assignLecturerUserId),
      });
      await refreshGroupQueries(targetGroup.groupId, queryClient);
      setAssignLecturerUserId('');
      setAssignLecturerOpen(false);
    } catch {
      // handled by mutation toast
    }
  };

  const handleRemoveMember = async (groupId, userId, username) => {
    if (!window.confirm(`Xoá "${username}" khỏi nhóm?`)) return;

    try {
      await removeMemberMutation.mutateAsync({ groupId, userId });
      await refreshGroupQueries(groupId, queryClient);
    } catch {
      // handled by mutation toast
    }
  };

  const handleRemoveLecturer = async (groupId, lecturerId, lecturerName) => {
    if (!window.confirm(`Xoá giảng viên "${lecturerName}" khỏi nhóm?`)) return;

    try {
      await removeLecturerMutation.mutateAsync({ groupId, lecturerId });
      await refreshGroupQueries(groupId, queryClient);
    } catch {
      // handled by mutation toast
    }
  };

  const handleCreateJiraProject = async () => {
    if (!targetGroup?.groupId) return;
    if (
      !jiraForm.projectKey.trim() ||
      !jiraForm.projectName.trim() ||
      !jiraForm.baseUrl.trim() ||
      !jiraForm.jiraEmail.trim() ||
      !jiraForm.jiraApiToken.trim()
    ) {
      toast.error('Vui lòng nhập đầy đủ thông tin Jira');
      return;
    }

    try {
      await createJiraMutation.mutateAsync({
        groupId: targetGroup.groupId,
        data: {
          project_key: jiraForm.projectKey.trim().toUpperCase(),
          project_name: jiraForm.projectName.trim(),
          base_url: jiraForm.baseUrl.trim(),
          jira_email: jiraForm.jiraEmail.trim(),
          jira_api_token: jiraForm.jiraApiToken.trim(),
        },
      });
      await refreshGroupQueries(targetGroup.groupId, queryClient);
      setJiraForm(DEFAULT_JIRA_FORM);
      setJiraOpen(false);
    } catch {
      // handled by mutation toast
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{groups.length} nhóm</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => groupsQuery.refetch()}
            disabled={groupsQuery.isFetching}
          >
            <RefreshCw size={14} className={groupsQuery.isFetching ? 'animate-spin' : ''} />
            <span className="ml-1">Làm mới</span>
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus size={14} />
            <span className="ml-1">Tạo nhóm</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Tên nhóm</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Giảng viên</TableHead>
                <TableHead>Trưởng nhóm</TableHead>
                <TableHead className="w-24 text-center">Thành viên</TableHead>
                <TableHead>Project Key</TableHead>
                <TableHead className="w-56 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupsQuery.isLoading ? (
                <AdminTableSkeleton cols={8} rows={6} />
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={<Users className="h-8 w-8" />}
                      title="Chưa có nhóm nào"
                      description="Tạo nhóm mới để gán thành viên, leader và lecturer."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <Fragment key={group.groupId}>
                    <TableRow className="hover:bg-muted/30">
                      <TableCell>
                        <button
                          onClick={() => handleToggleExpand(group.groupId)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {expandedGroupId === group.groupId ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-semibold">{group.groupName}</TableCell>
                      <TableCell>{group.semester || '—'}</TableCell>
                      <TableCell>{group.lecturer?.username || '—'}</TableCell>
                      <TableCell>
                        {group.teamLeader ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Crown size={12} className="text-yellow-500" />
                            {group.teamLeader.username}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {group.members.length}
                      </TableCell>
                      <TableCell>
                        {group.projectKey ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {group.projectKey}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Chỉnh sửa nhóm"
                            onClick={() => openEditDialog(group)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Thêm thành viên"
                            onClick={() => {
                              setTargetGroup(group);
                              setAddMemberUserId('');
                              setAddMemberOpen(true);
                            }}
                          >
                            <UserPlus size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Chỉ định trưởng nhóm"
                            onClick={() => {
                              setTargetGroup(group);
                              setAssignLeaderUserId(
                                group.teamLeader?.userId ? String(group.teamLeader.userId) : '',
                              );
                              setAssignLeaderOpen(true);
                            }}
                          >
                            <Crown size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Gán giảng viên"
                            onClick={() => {
                              setTargetGroup(group);
                              setAssignLecturerUserId('');
                              setAssignLecturerOpen(true);
                            }}
                          >
                            <UserCheck size={14} />
                          </Button>
                          {!group.projectKey && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Tạo dự án Jira"
                              onClick={() => {
                                setTargetGroup(group);
                                setJiraForm({
                                  projectKey: '',
                                  projectName: group.projectTitle || group.groupName,
                                  baseUrl: '',
                                  jiraEmail: '',
                                  jiraApiToken: '',
                                });
                                setJiraOpen(true);
                              }}
                            >
                              <Zap size={14} className="text-blue-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xoá nhóm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteGroup(group)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {expandedGroupId === group.groupId && (
                      <TableRow className="bg-muted/20">
                        <TableCell />
                        <TableCell colSpan={7}>
                          {groupDetailQuery.isLoading ||
                          leaderQuery.isLoading ||
                          lecturersQuery.isLoading ? (
                            <div className="space-y-2 py-3">
                              <Skeleton className="h-4 w-1/3" />
                              <Skeleton className="h-4 w-1/2" />
                              <Skeleton className="h-4 w-2/5" />
                            </div>
                          ) : (
                            <div className="space-y-4 py-2">
                              <div className="grid gap-3 md:grid-cols-4">
                                <div className="rounded-md border bg-background p-3">
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Group ID
                                  </p>
                                  <p className="mt-1 text-sm font-medium">
                                    {groupDetail?.groupId || group.groupId}
                                  </p>
                                </div>
                                <div className="rounded-md border bg-background p-3">
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Semester
                                  </p>
                                  <p className="mt-1 text-sm font-medium">
                                    {groupDetail?.semester || group.semester || '—'}
                                  </p>
                                </div>
                                <div className="rounded-md border bg-background p-3">
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Project Title
                                  </p>
                                  <p className="mt-1 text-sm font-medium">
                                    {groupDetail?.projectTitle || group.projectTitle || '—'}
                                  </p>
                                </div>
                                <div className="rounded-md border bg-background p-3">
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Ngày tạo
                                  </p>
                                  <p className="mt-1 text-sm font-medium">
                                    {groupDetail?.createdAt
                                      ? new Date(groupDetail.createdAt).toLocaleDateString('vi-VN')
                                      : '—'}
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Trưởng nhóm
                                </p>
                                {leaderDetail ? (
                                  <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                                    <Crown size={14} className="text-yellow-500" />
                                    <span className="font-medium">
                                      {leaderDetail.user?.full_name ||
                                        leaderDetail.full_name ||
                                        '—'}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {leaderDetail.user?.email || leaderDetail.email || ''}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Chưa có trưởng nhóm
                                  </span>
                                )}
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Giảng viên phụ trách
                                </p>
                                {lecturerAssignments.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {lecturerAssignments.map((assignment) => (
                                      <div
                                        key={`${assignment.group_id}-${assignment.lecturer_id}`}
                                        className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                                      >
                                        <span>
                                          {assignment.user?.full_name || assignment.user?.email}
                                        </span>
                                        <button
                                          className="text-muted-foreground hover:text-destructive"
                                          title="Xoá giảng viên"
                                          onClick={() =>
                                            handleRemoveLecturer(
                                              group.groupId,
                                              assignment.lecturer_id,
                                              assignment.user?.full_name || assignment.user?.email,
                                            )
                                          }
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Chưa có giảng viên nào
                                  </span>
                                )}
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Thành viên nhóm
                                </p>
                                {group.members.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {group.members.map((member) => (
                                      <div
                                        key={`${group.groupId}-${member.userId}`}
                                        className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs"
                                      >
                                        <span>{member.username}</span>
                                        <AdminRoleBadge role={member.role} />
                                        <button
                                          className="text-muted-foreground hover:text-destructive"
                                          title="Xoá thành viên"
                                          onClick={() =>
                                            handleRemoveMember(
                                              group.groupId,
                                              member.userId,
                                              member.username,
                                            )
                                          }
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Chưa có thành viên
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminGroupFormDialog
        open={createOpen}
        title="Tạo nhóm mới"
        form={groupForm}
        availableMembers={availableMembers}
        availableLecturers={availableLecturers}
        onOpenChange={setCreateOpen}
        onFormChange={setGroupForm}
        onToggleMemberSelect={handleToggleMemberSelect}
        onSubmit={handleCreateGroup}
        submitting={
          createGroupMutation.isPending ||
          addMemberMutation.isPending ||
          assignLeaderMutation.isPending ||
          assignLecturerMutation.isPending
        }
      />

      <AdminGroupFormDialog
        open={editOpen}
        title="Chỉnh sửa nhóm"
        form={groupForm}
        availableMembers={availableMembers}
        availableLecturers={availableLecturers}
        onOpenChange={setEditOpen}
        onFormChange={setGroupForm}
        onToggleMemberSelect={handleToggleMemberSelect}
        onSubmit={handleUpdateGroup}
        submitting={updateGroupMutation.isPending}
        disableMemberSelection
      />

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Thêm thành viên {targetGroup ? `- ${targetGroup.groupName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Chọn người dùng</Label>
              <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn thành viên..." />
                </SelectTrigger>
                <SelectContent>
                  {selectableMembers.map((user) => (
                    <SelectItem key={user.userId} value={String(user.userId)}>
                      {user.username} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Đang thêm...' : 'Thêm thành viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignLeaderOpen} onOpenChange={setAssignLeaderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Chỉ định trưởng nhóm {targetGroup ? `- ${targetGroup.groupName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Chọn thành viên</Label>
              <Select value={assignLeaderUserId} onValueChange={setAssignLeaderUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn leader..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedMembersForLeader.map((member) => (
                    <SelectItem key={member.userId} value={String(member.userId)}>
                      {member.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignLeaderOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={handleAssignLeader}
              disabled={assignLeaderMutation.isPending || selectedMembersForLeader.length === 0}
            >
              {assignLeaderMutation.isPending ? 'Đang lưu...' : 'Lưu leader'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignLecturerOpen} onOpenChange={setAssignLecturerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Gán giảng viên {targetGroup ? `- ${targetGroup.groupName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Chọn giảng viên</Label>
              <Select value={assignLecturerUserId} onValueChange={setAssignLecturerUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn giảng viên..." />
                </SelectTrigger>
                <SelectContent>
                  {selectableLecturers.map((lecturer) => (
                    <SelectItem key={lecturer.userId} value={String(lecturer.userId)}>
                      {lecturer.username} - {lecturer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignLecturerOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleAssignLecturer} disabled={assignLecturerMutation.isPending}>
              {assignLecturerMutation.isPending ? 'Đang lưu...' : 'Gán giảng viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={jiraOpen} onOpenChange={setJiraOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Tạo dự án Jira {targetGroup ? `- ${targetGroup.groupName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Project Key</Label>
              <Input
                className="mt-1 uppercase"
                value={jiraForm.projectKey}
                maxLength={10}
                onChange={(event) =>
                  setJiraForm((prev) => ({
                    ...prev,
                    projectKey: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="SWD392"
              />
            </div>
            <div>
              <Label>Project Name</Label>
              <Input
                className="mt-1"
                value={jiraForm.projectName}
                onChange={(event) =>
                  setJiraForm((prev) => ({ ...prev, projectName: event.target.value }))
                }
                placeholder="Tên dự án Jira"
              />
            </div>
            <div>
              <Label>Jira Base URL</Label>
              <Input
                className="mt-1"
                value={jiraForm.baseUrl}
                onChange={(event) =>
                  setJiraForm((prev) => ({ ...prev, baseUrl: event.target.value }))
                }
                placeholder="https://your-org.atlassian.net"
              />
            </div>
            <div>
              <Label>Jira Email</Label>
              <Input
                className="mt-1"
                type="email"
                value={jiraForm.jiraEmail}
                onChange={(event) =>
                  setJiraForm((prev) => ({ ...prev, jiraEmail: event.target.value }))
                }
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label>Jira API Token</Label>
              <Input
                className="mt-1"
                type="password"
                value={jiraForm.jiraApiToken}
                onChange={(event) =>
                  setJiraForm((prev) => ({ ...prev, jiraApiToken: event.target.value }))
                }
                placeholder="Jira API Token"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJiraOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleCreateJiraProject} disabled={createJiraMutation.isPending}>
              {createJiraMutation.isPending ? 'Đang tạo...' : 'Tạo dự án'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function refreshGroupQueries(groupId, queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.ALL }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.DETAIL(groupId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.MEMBERS(groupId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.LEADER(groupId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS.LECTURERS(groupId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JIRA.CONFIG(groupId) }),
  ]);
}
