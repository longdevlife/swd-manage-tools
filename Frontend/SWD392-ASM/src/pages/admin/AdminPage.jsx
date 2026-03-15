import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  Layers,
  FileText,
  Zap,
  Plus,
  Trash2,
  UserPlus,
  Crown,
  UserMinus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  getGroupsApi,
  createGroupApi,
  deleteGroupApi,
  addMemberApi,
  removeMemberApi,
  assignLeaderApi,
  removeLecturerApi,
} from '@/features/groups/api/groupsApi';
import { getUsersApi } from '@/features/users/api/usersApi';
import { configureJiraApi } from '@/features/jira/api/jiraApi';

// ── Wrappers: giữ nguyên function signatures mà AdminPage đang gọi ──
const getUsers = (role) =>
  getUsersApi(role && role !== 'ALL' ? { role } : {});
const getAllGroups = () => getGroupsApi();
const createGroup = (data) => createGroupApi(data);
const deleteGroup = (groupId) => deleteGroupApi(groupId);
const addMember = (groupId, userId) =>
  addMemberApi(groupId, { userId });
const removeMember = (groupId, userId) =>
  removeMemberApi(groupId, userId);
const assignLeader = (groupId, leaderId) =>
  assignLeaderApi(groupId, { userId: leaderId });
const removeLecturer = (groupId) =>
  removeLecturerApi(groupId, null); // Backend route: DELETE /groups/:id/lecturers/:lecturerId
const createJiraProject = (groupId, data) =>
  configureJiraApi(groupId, data);
// Stubs — backend chưa có routes cho các chức năng này
const getGroupRequests = () => Promise.resolve([]);
const approveRequest = () => Promise.reject(new Error('API chưa được triển khai'));
const rejectRequest = () => Promise.reject(new Error('API chưa được triển khai'));
const testJiraConnection = () => Promise.resolve({ status: 'ok' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_BADGE_VARIANT = {
  ROLE_ADMIN: 'destructive',
  ROLE_LECTURER: 'secondary',
  ROLE_LEADER: 'default',
  ROLE_MEMBER: 'outline',
};

const ROLE_LABEL = {
  ROLE_ADMIN: 'Admin',
  ROLE_LECTURER: 'Lecturer',
  ROLE_LEADER: 'Leader',
  ROLE_MEMBER: 'Member',
};

const REQUEST_STATUS_VARIANT = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

function RoleBadge({ role }) {
  return (
    <Badge variant={ROLE_BADGE_VARIANT[role] ?? 'outline'} className="text-xs">
      {ROLE_LABEL[role] ?? role}
    </Badge>
  );
}

function StatusBadge({ status }) {
  const cls =
    {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
    }[status] ?? 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

function TableSkeleton({ cols = 5, rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers(roleFilter);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Lọc theo Role:</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="ROLE_ADMIN">Admin</SelectItem>
              <SelectItem value="ROLE_LECTURER">Lecturer</SelectItem>
              <SelectItem value="ROLE_LEADER">Leader</SelectItem>
              <SelectItem value="ROLE_MEMBER">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="ml-1">Làm mới</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tên người dùng</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-20">Năm sinh</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead className="w-28 text-center">Jira Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton cols={7} rows={8} />
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Không có người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {u.userId}
                    </TableCell>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.username ?? '—'}</TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell>{u.yob ?? '—'}</TableCell>
                    <TableCell>{u.phoneNumber ?? '—'}</TableCell>
                    <TableCell className="text-center">
                      {u.jiraSynced ? (
                        <CheckCircle2 size={16} className="mx-auto text-green-500" />
                      ) : (
                        <XCircle size={16} className="mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{users.length} người dùng</p>
    </div>
  );
}

// ─── GROUPS TAB ───────────────────────────────────────────────────────────────

function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Create Group Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({ groupName: '', leaderId: '', memberIds: [] });
  const [createLoading, setCreateLoading] = useState(false);

  // Add Member Dialog
  const [addMemberState, setAddMemberState] = useState({
    open: false,
    groupId: null,
    groupName: '',
  });
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  // Assign Leader Dialog
  const [assignLeaderState, setAssignLeaderState] = useState({
    open: false,
    groupId: null,
    groupName: '',
    members: [],
  });
  const [assignLeaderUserId, setAssignLeaderUserId] = useState('');
  const [assignLeaderLoading, setAssignLeaderLoading] = useState(false);

  // Create Jira Project Dialog
  const [jiraDialog, setJiraDialog] = useState({ open: false, groupId: null, groupName: '' });
  const [jiraData, setJiraData] = useState({ projectKey: '', projectName: '' });
  const [jiraLoading, setJiraLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [grps, usrs] = await Promise.all([getAllGroups(), getUsers('ALL')]);
      setGroups(Array.isArray(grps) ? grps : []);
      setAllUsers(Array.isArray(usrs) ? usrs : []);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateGroup = async () => {
    if (!createData.groupName.trim()) {
      toast.error('Tên nhóm không được để trống');
      return;
    }
    setCreateLoading(true);
    try {
      const payload = {
        groupName: createData.groupName.trim(),
        leaderId: createData.leaderId ? Number(createData.leaderId) : undefined,
        memberIds: createData.memberIds.map(Number),
      };
      await createGroup(payload);
      toast.success('Tạo nhóm thành công!');
      setCreateOpen(false);
      setCreateData({ groupName: '', leaderId: '', memberIds: [] });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Tạo nhóm thất bại');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Xoá nhóm "${groupName}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await deleteGroup(groupId);
      toast.success(`Đã xoá nhóm "${groupName}"`);
      fetchData();
    } catch {
      toast.error('Xoá nhóm thất bại');
    }
  };

  const handleAddMember = async () => {
    if (!addMemberUserId) {
      toast.error('Vui lòng chọn người dùng');
      return;
    }
    setAddMemberLoading(true);
    try {
      await addMember(addMemberState.groupId, Number(addMemberUserId));
      toast.success('Thêm thành viên thành công!');
      setAddMemberState({ open: false, groupId: null, groupName: '' });
      setAddMemberUserId('');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Thêm thành viên thất bại');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async (groupId, userId, userName) => {
    if (!window.confirm(`Xoá "${userName}" khỏi nhóm?`)) return;
    try {
      await removeMember(groupId, userId);
      toast.success('Đã xoá thành viên');
      fetchData();
    } catch {
      toast.error('Xoá thành viên thất bại');
    }
  };

  const handleAssignLeader = async () => {
    if (!assignLeaderUserId) {
      toast.error('Vui lòng chọn thành viên');
      return;
    }
    setAssignLeaderLoading(true);
    try {
      await assignLeader(assignLeaderState.groupId, Number(assignLeaderUserId));
      toast.success('Đã chỉ định trưởng nhóm!');
      setAssignLeaderState({ open: false, groupId: null, groupName: '', members: [] });
      setAssignLeaderUserId('');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Chỉ định trưởng nhóm thất bại');
    } finally {
      setAssignLeaderLoading(false);
    }
  };

  const handleRemoveLecturer = async (groupId, groupName) => {
    if (!window.confirm(`Xoá giảng viên khỏi nhóm "${groupName}"?`)) return;
    try {
      await removeLecturer(groupId);
      toast.success('Đã xoá giảng viên khỏi nhóm');
      fetchData();
    } catch {
      toast.error('Xoá giảng viên thất bại');
    }
  };

  const handleCreateJira = async () => {
    if (!jiraData.projectKey.trim() || !jiraData.projectName.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin Jira');
      return;
    }
    setJiraLoading(true);
    try {
      await createJiraProject(jiraDialog.groupId, {
        projectKey: jiraData.projectKey.trim().toUpperCase(),
        projectName: jiraData.projectName.trim(),
      });
      toast.success('Tạo dự án Jira thành công!');
      setJiraDialog({ open: false, groupId: null, groupName: '' });
      setJiraData({ projectKey: '', projectName: '' });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Tạo dự án Jira thất bại');
    } finally {
      setJiraLoading(false);
    }
  };

  const toggleMemberSelect = (userId) => {
    setCreateData((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(String(userId))
        ? prev.memberIds.filter((id) => id !== String(userId))
        : [...prev.memberIds, String(userId)],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{groups.length} nhóm</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="ml-1">Làm mới</span>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
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
                <TableHead className="w-8"></TableHead>
                <TableHead>Tên nhóm</TableHead>
                <TableHead>Giảng viên</TableHead>
                <TableHead>Trưởng nhóm</TableHead>
                <TableHead className="w-24 text-center">Thành viên</TableHead>
                <TableHead>Project Key</TableHead>
                <TableHead className="w-48 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton cols={7} rows={6} />
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Chưa có nhóm nào
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((g) => (
                  <>
                    <TableRow key={g.groupId} className="hover:bg-muted/30">
                      <TableCell>
                        <button
                          onClick={() =>
                            setExpandedGroup(expandedGroup === g.groupId ? null : g.groupId)
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {expandedGroup === g.groupId ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-semibold">{g.groupName}</TableCell>
                      <TableCell>
                        {g.lecturer ? (
                          <span className="text-sm">
                            {g.lecturer.username ?? g.lecturer.userId}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {g.teamLeader ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Crown size={12} className="text-yellow-500" />
                            {g.teamLeader.username ?? g.teamLeader.userId}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {g.members?.length ?? 0}
                      </TableCell>
                      <TableCell>
                        {g.projectKey ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {g.projectKey}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Thêm thành viên"
                            onClick={() => {
                              setAddMemberState({
                                open: true,
                                groupId: g.groupId,
                                groupName: g.groupName,
                              });
                              setAddMemberUserId('');
                            }}
                          >
                            <UserPlus size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Chỉ định trưởng nhóm"
                            onClick={() => {
                              setAssignLeaderState({
                                open: true,
                                groupId: g.groupId,
                                groupName: g.groupName,
                                members: g.members ?? [],
                              });
                              setAssignLeaderUserId('');
                            }}
                          >
                            <Crown size={14} />
                          </Button>
                          {g.lecturer && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Xoá giảng viên"
                              onClick={() => handleRemoveLecturer(g.groupId, g.groupName)}
                            >
                              <UserMinus size={14} />
                            </Button>
                          )}
                          {!g.projectKey && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Tạo dự án Jira"
                              onClick={() => {
                                setJiraDialog({
                                  open: true,
                                  groupId: g.groupId,
                                  groupName: g.groupName,
                                });
                                setJiraData({ projectKey: '', projectName: '' });
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
                            onClick={() => handleDeleteGroup(g.groupId, g.groupName)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Members Row */}
                    {expandedGroup === g.groupId && (
                      <TableRow key={`${g.groupId}-members`} className="bg-muted/20">
                        <TableCell />
                        <TableCell colSpan={6}>
                          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Thành viên nhóm
                          </p>
                          {g.members && g.members.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {g.members.map((m) => (
                                <div
                                  key={m.userId}
                                  className="flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs"
                                >
                                  <span>{m.username ?? m.userId}</span>
                                  <RoleBadge role={m.role} />
                                  <button
                                    className="ml-1 text-muted-foreground hover:text-destructive"
                                    title="Xoá khỏi nhóm"
                                    onClick={() =>
                                      handleRemoveMember(
                                        g.groupId,
                                        m.userId,
                                        m.username ?? m.userId,
                                      )
                                    }
                                  >
                                    <XCircle size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Chưa có thành viên
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create Group Dialog ─────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo nhóm mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Tên nhóm *</Label>
              <Input
                className="mt-1"
                placeholder="Vd: Group 1A"
                value={createData.groupName}
                onChange={(e) => setCreateData((p) => ({ ...p, groupName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Trưởng nhóm</Label>
              <Select
                value={createData.leaderId}
                onValueChange={(v) => setCreateData((p) => ({ ...p, leaderId: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn trưởng nhóm (tuỳ chọn)" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter((u) => u.role !== 'ROLE_ADMIN' && u.role !== 'ROLE_LECTURER')
                    .map((u) => (
                      <SelectItem key={u.userId} value={String(u.userId)}>
                        {u.username ?? u.email} ({ROLE_LABEL[u.role] ?? u.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thành viên</Label>
              <div className="mt-1 max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                {allUsers
                  .filter((u) => u.role !== 'ROLE_ADMIN' && u.role !== 'ROLE_LECTURER')
                  .map((u) => (
                    <label
                      key={u.userId}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 hover:bg-muted text-sm"
                    >
                      <Checkbox
                        checked={createData.memberIds.includes(String(u.userId))}
                        onCheckedChange={() => toggleMemberSelect(u.userId)}
                      />
                      <span>{u.username ?? u.email}</span>
                      <RoleBadge role={u.role} />
                    </label>
                  ))}
                {allUsers.filter((u) => u.role !== 'ROLE_ADMIN' && u.role !== 'ROLE_LECTURER')
                  .length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    Không có thành viên
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {createData.memberIds.length} thành viên được chọn
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleCreateGroup} disabled={createLoading}>
              {createLoading ? 'Đang tạo...' : 'Tạo nhóm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ───────────────────────────────────────── */}
      <Dialog
        open={addMemberState.open}
        onOpenChange={(v) => !v && setAddMemberState((p) => ({ ...p, open: false }))}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm thành viên — {addMemberState.groupName}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Chọn người dùng</Label>
            <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Chọn người dùng..." />
              </SelectTrigger>
              <SelectContent>
                {allUsers
                  .filter((u) => u.role !== 'ROLE_ADMIN')
                  .map((u) => (
                    <SelectItem key={u.userId} value={String(u.userId)}>
                      {u.username ?? u.email} — <RoleBadge role={u.role} />
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddMemberState((p) => ({ ...p, open: false }))}
            >
              Huỷ
            </Button>
            <Button onClick={handleAddMember} disabled={addMemberLoading}>
              {addMemberLoading ? 'Đang thêm...' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Leader Dialog ────────────────────────────────────── */}
      <Dialog
        open={assignLeaderState.open}
        onOpenChange={(v) => !v && setAssignLeaderState((p) => ({ ...p, open: false }))}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Chỉ định trưởng nhóm — {assignLeaderState.groupName}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Chọn thành viên làm trưởng nhóm</Label>
            <Select value={assignLeaderUserId} onValueChange={setAssignLeaderUserId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Chọn thành viên..." />
              </SelectTrigger>
              <SelectContent>
                {assignLeaderState.members.map((m) => (
                  <SelectItem key={m.userId} value={String(m.userId)}>
                    {m.username ?? m.userId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignLeaderState.members.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Nhóm chưa có thành viên nào</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignLeaderState((p) => ({ ...p, open: false }))}
            >
              Huỷ
            </Button>
            <Button
              onClick={handleAssignLeader}
              disabled={assignLeaderLoading || assignLeaderState.members.length === 0}
            >
              {assignLeaderLoading ? 'Đang lưu...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Jira Project Dialog ──────────────────────────────── */}
      <Dialog
        open={jiraDialog.open}
        onOpenChange={(v) => !v && setJiraDialog((p) => ({ ...p, open: false }))}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tạo dự án Jira — {jiraDialog.groupName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Project Key *</Label>
              <Input
                className="mt-1 uppercase"
                placeholder="Vd: PROJA"
                value={jiraData.projectKey}
                onChange={(e) =>
                  setJiraData((p) => ({ ...p, projectKey: e.target.value.toUpperCase() }))
                }
                maxLength={10}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Chỉ gồm chữ in hoa và số, tối đa 10 ký tự
              </p>
            </div>
            <div>
              <Label>Tên dự án *</Label>
              <Input
                className="mt-1"
                placeholder="Vd: Group 1A Project"
                value={jiraData.projectName}
                onChange={(e) => setJiraData((p) => ({ ...p, projectName: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJiraDialog((p) => ({ ...p, open: false }))}>
              Huỷ
            </Button>
            <Button onClick={handleCreateJira} disabled={jiraLoading}>
              {jiraLoading ? 'Đang tạo...' : 'Tạo dự án'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── GROUP REQUESTS TAB ───────────────────────────────────────────────────────

function GroupRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGroupRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải yêu cầu nhóm');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    try {
      await approveRequest(id);
      toast.success('Đã duyệt yêu cầu! Nhóm và dự án Jira đã được tạo.');
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Duyệt yêu cầu thất bại');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Từ chối yêu cầu này?')) return;
    try {
      await rejectRequest(id);
      toast.success('Đã từ chối yêu cầu');
      fetchRequests();
    } catch {
      toast.error('Từ chối yêu cầu thất bại');
    }
  };

  const pending = requests.filter((r) => r.status === 'PENDING');
  const processed = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{requests.length} yêu cầu</p>
          {pending.length > 0 && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
              {pending.length} chờ duyệt
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="ml-1">Làm mới</span>
        </Button>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={14} className="text-yellow-500" />
            Chờ xét duyệt ({pending.length})
          </h3>
          <Card className="border-yellow-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Tên nhóm</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead>Trưởng nhóm</TableHead>
                    <TableHead className="w-24 text-center">Thành viên</TableHead>
                    <TableHead className="w-28">Trạng thái</TableHead>
                    <TableHead className="w-32 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton cols={7} rows={3} />
                  ) : (
                    pending.map((r) => (
                      <TableRow key={r.requestId}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {r.requestId}
                        </TableCell>
                        <TableCell className="font-semibold">{r.groupName}</TableCell>
                        <TableCell>{r.lecturer?.username ?? r.lecturer?.userId ?? '—'}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Crown size={12} className="text-yellow-500" />
                            {r.leader?.username ?? r.leader?.userId ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {r.members?.length ?? 0}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                              onClick={() => handleApprove(r.requestId)}
                            >
                              <CheckCircle2 size={12} className="mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleReject(r.requestId)}
                            >
                              <XCircle size={12} className="mr-1" />
                              Từ chối
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Processed Requests */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
          Đã xử lý ({processed.length})
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Tên nhóm</TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Trưởng nhóm</TableHead>
                  <TableHead className="w-24 text-center">Thành viên</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton cols={6} rows={4} />
                ) : processed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      Chưa có yêu cầu nào đã xử lý
                    </TableCell>
                  </TableRow>
                ) : (
                  processed.map((r) => (
                    <TableRow key={r.requestId}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.requestId}
                      </TableCell>
                      <TableCell className="font-semibold">{r.groupName}</TableCell>
                      <TableCell>{r.lecturer?.username ?? r.lecturer?.userId ?? '—'}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Crown size={12} className="text-yellow-500" />
                          {r.leader?.username ?? r.leader?.userId ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {r.members?.length ?? 0}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {!loading && requests.length === 0 && (
        <Card className="py-16">
          <CardContent className="text-center text-muted-foreground">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>Không có yêu cầu nhóm nào</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── JIRA TAB ─────────────────────────────────────────────────────────────────

function JiraTab() {
  const [jiraStatus, setJiraStatus] = useState(null); // null | 'success' | 'fail'
  const [jiraStatusLoading, setJiraStatusLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [jiraDialog, setJiraDialog] = useState({ open: false, groupId: null, groupName: '' });
  const [jiraData, setJiraData] = useState({ projectKey: '', projectName: '' });
  const [jiraCreateLoading, setJiraCreateLoading] = useState(false);

  const handleTestConnection = async () => {
    setJiraStatusLoading(true);
    setJiraStatus(null);
    try {
      await testJiraConnection();
      setJiraStatus('success');
      toast.success('Kết nối Jira thành công!');
    } catch {
      setJiraStatus('fail');
      toast.error('Kết nối Jira thất bại');
    } finally {
      setJiraStatusLoading(false);
    }
  };

  const fetchGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const data = await getAllGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải danh sách nhóm');
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateJira = async () => {
    if (!jiraData.projectKey.trim() || !jiraData.projectName.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setJiraCreateLoading(true);
    try {
      await createJiraProject(jiraDialog.groupId, {
        projectKey: jiraData.projectKey.trim().toUpperCase(),
        projectName: jiraData.projectName.trim(),
      });
      toast.success('Tạo dự án Jira thành công!');
      setJiraDialog({ open: false, groupId: null, groupName: '' });
      setJiraData({ projectKey: '', projectName: '' });
      fetchGroups();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Tạo dự án Jira thất bại');
    } finally {
      setJiraCreateLoading(false);
    }
  };

  const noJiraGroups = groups.filter((g) => !g.projectKey);
  const jiraGroups = groups.filter((g) => !!g.projectKey);

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap size={18} className="text-blue-500" />
            Kết nối Jira
          </CardTitle>
          <CardDescription>Kiểm tra kết nối đến Jira Cloud API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={handleTestConnection} disabled={jiraStatusLoading} variant="outline">
              <RefreshCw size={14} className={jiraStatusLoading ? 'animate-spin mr-1' : 'mr-1'} />
              Kiểm tra kết nối
            </Button>
            {jiraStatus === 'success' && (
              <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <Wifi size={16} />
                Kết nối thành công
              </span>
            )}
            {jiraStatus === 'fail' && (
              <span className="flex items-center gap-2 text-sm text-red-500 font-medium">
                <WifiOff size={16} />
                Kết nối thất bại — Kiểm tra cấu hình Jira
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Groups with Jira */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 size={14} className="text-green-500" />
          Nhóm đã có Jira Project ({jiraGroups.length})
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhóm</TableHead>
                  <TableHead>Project Key</TableHead>
                  <TableHead>Trưởng nhóm</TableHead>
                  <TableHead className="w-24 text-center">Thành viên</TableHead>
                  <TableHead className="w-28">Trạng thái Jira</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupsLoading ? (
                  <TableSkeleton cols={5} rows={4} />
                ) : jiraGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground text-sm"
                    >
                      Chưa nhóm nào có Jira project
                    </TableCell>
                  </TableRow>
                ) : (
                  jiraGroups.map((g) => (
                    <TableRow key={g.groupId}>
                      <TableCell className="font-semibold">{g.groupName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {g.projectKey}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {g.teamLeader ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Crown size={12} className="text-yellow-500" />
                            {g.teamLeader.username ?? g.teamLeader.userId}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {g.members?.length ?? 0}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                          Đã liên kết
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Groups without Jira */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={14} className="text-yellow-500" />
          Nhóm chưa có Jira Project ({noJiraGroups.length})
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhóm</TableHead>
                  <TableHead>Trưởng nhóm</TableHead>
                  <TableHead className="w-24 text-center">Thành viên</TableHead>
                  <TableHead className="w-40 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupsLoading ? (
                  <TableSkeleton cols={4} rows={3} />
                ) : noJiraGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground text-sm"
                    >
                      Tất cả nhóm đã có Jira project
                    </TableCell>
                  </TableRow>
                ) : (
                  noJiraGroups.map((g) => (
                    <TableRow key={g.groupId}>
                      <TableCell className="font-semibold">{g.groupName}</TableCell>
                      <TableCell>
                        {g.teamLeader ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Crown size={12} className="text-yellow-500" />
                            {g.teamLeader.username ?? g.teamLeader.userId}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {g.members?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50 h-7 px-2 text-xs"
                          onClick={() => {
                            setJiraDialog({
                              open: true,
                              groupId: g.groupId,
                              groupName: g.groupName,
                            });
                            setJiraData({ projectKey: '', projectName: '' });
                          }}
                        >
                          <Zap size={12} className="mr-1" />
                          Tạo Jira Project
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Jira Project Dialog */}
      <Dialog
        open={jiraDialog.open}
        onOpenChange={(v) => !v && setJiraDialog((p) => ({ ...p, open: false }))}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tạo Jira Project — {jiraDialog.groupName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Project Key *</Label>
              <Input
                className="mt-1 uppercase"
                placeholder="Vd: PROJA"
                value={jiraData.projectKey}
                onChange={(e) =>
                  setJiraData((p) => ({ ...p, projectKey: e.target.value.toUpperCase() }))
                }
                maxLength={10}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Chỉ chữ in hoa và số, tối đa 10 ký tự
              </p>
            </div>
            <div>
              <Label>Tên dự án *</Label>
              <Input
                className="mt-1"
                placeholder="Vd: Group 1A Project"
                value={jiraData.projectName}
                onChange={(e) => setJiraData((p) => ({ ...p, projectName: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJiraDialog((p) => ({ ...p, open: false }))}>
              Huỷ
            </Button>
            <Button onClick={handleCreateJira} disabled={jiraCreateLoading}>
              {jiraCreateLoading ? 'Đang tạo...' : 'Tạo dự án'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'groups', label: 'Nhóm', icon: Layers },
    { id: 'requests', label: 'Yêu cầu nhóm', icon: FileText },
    { id: 'jira', label: 'Jira', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý người dùng, nhóm và tích hợp hệ thống
          </p>
        </div>
      </div>

      <Separator />

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'requests' && <GroupRequestsTab />}
        {activeTab === 'jira' && <JiraTab />}
      </div>
    </div>
  );
}
