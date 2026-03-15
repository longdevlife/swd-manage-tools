import { Fragment, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
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
  getLeaderApi,
  getLecturersApi,
  removeLecturerApi,
  removeMemberApi,
  updateGroupApi,
  useGroupDetail,
  useGroups,
  useLeader,
  useLecturers,
  useMembers,
} from '@/features/groups';
import { useUsers } from '@/features/users';

const DEFAULT_GROUP_FORM = {
  groupName: '',
  semester: '',
  projectTitle: '',
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
  const targetMembersQuery = useMembers(
    addMemberOpen || assignLeaderOpen ? targetGroup?.groupId : null,
  );

  const groups = Array.isArray(groupsQuery.data?.data)
    ? groupsQuery.data.data.map(normalizeGroup)
    : [];
  const users = Array.isArray(usersQuery.data?.data) ? usersQuery.data.data.map(normalizeUser) : [];

  const isAdminUser = (user) =>
    user.role === 'ROLE_ADMIN' || (Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN'));
  const isLecturerUser = (user) =>
    user.role === 'ROLE_LECTURER' ||
    (Array.isArray(user.roles) && user.roles.includes('ROLE_LECTURER'));

  const availableMembers = users.filter((user) => !isAdminUser(user) && !isLecturerUser(user));
  const availableLecturers = users.filter((user) => isLecturerUser(user));
  const expandedGroup = groups.find((group) => group.groupId === expandedGroupId) ?? null;
  const targetGroupLatest =
    groups.find((group) => group.groupId === targetGroup?.groupId) ?? targetGroup;
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
  const targetMembersFromApi = Array.isArray(targetMembersQuery.data?.data)
    ? targetMembersQuery.data.data.map((member) => ({
        userId: member?.user?.user_id ?? member?.user_id,
        username:
          member?.user?.full_name ??
          member?.user?.email ??
          `User #${member?.user?.user_id ?? member?.user_id ?? ''}`,
        email: member?.user?.email ?? '',
      }))
    : [];

  const createGroupMutation = useMutation({
    mutationFn: createGroupApi,
  });
  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }) => updateGroupApi(groupId, data),
    onSuccess: () => {
      toast.success('Group updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update group');
    },
  });
  const deleteGroupMutation = useMutation({
    mutationFn: deleteGroupApi,
    onSuccess: () => {
      toast.success('Group deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    },
  });
  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }) => addMemberApi(groupId, { user_id: userId }),
    onSuccess: () => {
      toast.success('Member added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add member');
    },
  });
  const assignLeaderMutation = useMutation({
    mutationFn: ({ groupId, userId }) => assignLeaderApi(groupId, { user_id: userId }),
    onSuccess: () => {
      toast.success('Leader assigned successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign leader');
    },
  });
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }) => removeMemberApi(groupId, userId),
    onSuccess: () => {
      toast.success('Member removed from group');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });
  const assignLecturerMutation = useMutation({
    mutationFn: ({ groupId, lecturerId }) =>
      assignLecturerApi(groupId, { lecturer_id: lecturerId }),
    onSuccess: () => {
      toast.success('Lecturer assigned to group');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign lecturer');
    },
  });
  const removeLecturerMutation = useMutation({
    mutationFn: ({ groupId, lecturerId }) => removeLecturerApi(groupId, lecturerId),
    onSuccess: () => {
      toast.success('Lecturer removed from group');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove lecturer');
    },
  });
  const createJiraMutation = useMutation({
    mutationFn: ({ groupId, data }) => configureJiraApi(groupId, data),
    onSuccess: () => {
      toast.success('Jira project created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create Jira project');
    },
  });

  const selectableMembers = targetGroup
    ? availableMembers.filter(
        (user) =>
          !targetMembersFromApi.some((member) => Number(member.userId) === Number(user.userId)),
      )
    : availableMembers;
  const selectedMembersForLeader =
    targetMembersFromApi.length > 0 ? targetMembersFromApi : (targetGroupLatest?.members ?? []);
  const selectableLecturers = availableLecturers.filter(
    (lecturer) =>
      !targetLecturerAssignments.some((assignment) => assignment.lecturer_id === lecturer.userId),
  );

  const lecturerListQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: QUERY_KEYS.GROUPS.LECTURERS(group.groupId),
      queryFn: () => getLecturersApi(group.groupId),
      enabled: !!group.groupId,
      staleTime: 60 * 1000,
    })),
  });

  const leaderListQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: QUERY_KEYS.GROUPS.LEADER(group.groupId),
      queryFn: () => getLeaderApi(group.groupId),
      enabled: !!group.groupId,
      staleTime: 60 * 1000,
    })),
  });

  const lecturerDisplayByGroupId = groups.reduce((acc, group, index) => {
    const result = lecturerListQueries[index]?.data;
    const assignments = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : [];
    const first = assignments[0];

    acc[group.groupId] =
      group.lecturer?.username || first?.user?.full_name || first?.user?.email || null;

    return acc;
  }, {});

  const leaderDisplayByGroupId = groups.reduce((acc, group, index) => {
    const result = leaderListQueries[index]?.data;
    const leader = result?.data || result || null;

    acc[group.groupId] =
      group.teamLeader?.username ||
      leader?.user?.full_name ||
      leader?.full_name ||
      leader?.user?.email ||
      leader?.email ||
      null;

    return acc;
  }, {});

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
    });
    setEditOpen(true);
  };

  const handleToggleExpand = (groupId) => {
    setExpandedGroupId((current) => (current === groupId ? null : groupId));
  };

  const handleCreateGroup = async () => {
    if (!groupForm.groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const created = await createGroupMutation.mutateAsync({
        group_name: groupForm.groupName.trim(),
        semester: groupForm.semester.trim() || 'SWD392',
        project_title: groupForm.projectTitle.trim() || groupForm.groupName.trim(),
      });

      const groupId = created?.data?.group_id;
      if (!groupId) {
        throw new Error('Could not retrieve the group ID after creation');
      }

      await refreshGroupQueries(groupId, queryClient);
      setCreateOpen(false);
      setGroupForm(DEFAULT_GROUP_FORM);
      toast.success('Group created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create group');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    if (!groupForm.groupName.trim()) {
      toast.error('Group name is required');
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
    if (!window.confirm(`Delete group "${group.groupName}"? This action cannot be undone.`)) {
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
      toast.error('Please select a user');
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
      toast.error('Please select a member');
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
      toast.error('Please select a lecturer');
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
    if (!window.confirm(`Remove "${username}" from this group?`)) return;

    try {
      await removeMemberMutation.mutateAsync({ groupId, userId });
      await refreshGroupQueries(groupId, queryClient);
    } catch {
      // handled by mutation toast
    }
  };

  const handleRemoveLecturer = async (groupId, lecturerId, lecturerName) => {
    if (!window.confirm(`Remove lecturer "${lecturerName}" from this group?`)) return;

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
      toast.error('Please complete all Jira fields');
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
        <p className="text-sm text-muted-foreground">{groups.length} groups</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => groupsQuery.refetch()}
            disabled={groupsQuery.isFetching}
          >
            <RefreshCw size={14} className={groupsQuery.isFetching ? 'animate-spin' : ''} />
            <span className="ml-1">Refresh</span>
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus size={14} />
            <span className="ml-1">Create Group</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Group Name</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Lecturer</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead className="w-24 text-center">Members</TableHead>
                <TableHead>Project Key</TableHead>
                <TableHead className="w-56 text-right">Actions</TableHead>
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
                      title="No groups found"
                      description="Create a group to assign members, leader, and lecturer."
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
                      <TableCell>{lecturerDisplayByGroupId[group.groupId] || '—'}</TableCell>
                      <TableCell>
                        {leaderDisplayByGroupId[group.groupId] ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Crown size={12} className="text-yellow-500" />
                            {leaderDisplayByGroupId[group.groupId]}
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
                            title="Edit group"
                            onClick={() => openEditDialog(group)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Add member"
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
                            title="Assign leader"
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
                            title="Assign lecturer"
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
                              title="Create Jira project"
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
                            title="Delete group"
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
                                    Created At
                                  </p>
                                  <p className="mt-1 text-sm font-medium">
                                    {groupDetail?.createdAt
                                      ? new Date(groupDetail.createdAt).toLocaleDateString('en-GB')
                                      : '—'}
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Leader
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
                                    No leader assigned
                                  </span>
                                )}
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Assigned Lecturers
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
                                          title="Remove lecturer"
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
                                    No lecturers assigned
                                  </span>
                                )}
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Group Members
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
                                          title="Remove member"
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
                                  <span className="text-sm text-muted-foreground">No members</span>
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
        title="Create New Group"
        form={groupForm}
        onOpenChange={setCreateOpen}
        onFormChange={setGroupForm}
        onSubmit={handleCreateGroup}
        submitting={createGroupMutation.isPending}
      />

      <AdminGroupFormDialog
        open={editOpen}
        title="Edit Group"
        form={groupForm}
        onOpenChange={setEditOpen}
        onFormChange={setGroupForm}
        onSubmit={handleUpdateGroup}
        submitting={updateGroupMutation.isPending}
      />

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Member {targetGroup ? `- ${targetGroup.groupName}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Select user</Label>
              <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select member..." />
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
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignLeaderOpen} onOpenChange={setAssignLeaderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Assign Leader {targetGroup ? `- ${targetGroup.groupName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Select member</Label>
              <Select value={assignLeaderUserId} onValueChange={setAssignLeaderUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select leader..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedMembersForLeader.map((member) => (
                    <SelectItem key={member.userId} value={String(member.userId)}>
                      {member.username}
                      {member.email ? ` - ${member.email}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignLeaderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignLeader}
              disabled={
                assignLeaderMutation.isPending ||
                targetMembersQuery.isFetching ||
                selectedMembersForLeader.length === 0
              }
            >
              {assignLeaderMutation.isPending ? 'Saving...' : 'Save Leader'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignLecturerOpen} onOpenChange={setAssignLecturerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Assign Lecturer {targetGroup ? `- ${targetGroup.groupName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Select lecturer</Label>
              <Select value={assignLecturerUserId} onValueChange={setAssignLecturerUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select lecturer..." />
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
              Cancel
            </Button>
            <Button onClick={handleAssignLecturer} disabled={assignLecturerMutation.isPending}>
              {assignLecturerMutation.isPending ? 'Saving...' : 'Assign Lecturer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={jiraOpen} onOpenChange={setJiraOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Create Jira Project {targetGroup ? `- ${targetGroup.groupName}` : ''}
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
                placeholder="Jira project name"
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
              Cancel
            </Button>
            <Button onClick={handleCreateJiraProject} disabled={createJiraMutation.isPending}>
              {createJiraMutation.isPending ? 'Creating...' : 'Create Project'}
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
