import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/stores/authSlice';
import {
  Search, Users, Mail, Phone, BookOpen, UserCheck, RefreshCw, Plus,
  UserMinus, ListTodo, FileBarChart, GitBranch, CircleDot, Timer,
  CirclePause, CircleCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import { getGroupsApi, getMembersApi, addMemberApi, removeMemberApi } from '@/features/groups/api/groupsApi';
import { getJiraIssuesApi, syncJiraIssuesApi } from '@/features/jira/api/jiraApi';
import { getReportsApi } from '@/features/reports/api/reportsApi';
import { getUsersApi } from '@/features/users/api/usersApi';
import { manualSyncApi } from '@/features/sync/api/syncApi';

// ─── Status Mapping ──────────────────────────────────────────────────────────
const STATUS_MAP = {
  'To Do': 'todo', 'In Progress': 'in_progress', 'In Review': 'in_review',
  Done: 'done', Closed: 'done', Resolved: 'done',
};
const STATUS_CONFIG = {
  todo: { label: 'To Do', icon: CircleDot, cls: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Timer, cls: 'bg-yellow-100 text-yellow-700' },
  in_review: { label: 'In Review', icon: CirclePause, cls: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', icon: CircleCheck, cls: 'bg-green-100 text-green-700' },
};
const PRIORITY_MAP = {
  Highest: 'urgent', High: 'high', Medium: 'medium', Low: 'low', Lowest: 'low',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LecturerConsolePage() {
  const user = useSelector(selectCurrentUser);

  // ── TAB state ──
  const [activeTab, setActiveTab] = useState('students'); // students | issues | reports

  // ── Shared state ──
  const [groups, setGroups] = useState([]);
  const [filterGroup, setFilterGroup] = useState('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // ── Students tab ──
  const [students, setStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberGroupId, setAddMemberGroupId] = useState(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  // ── Issues tab ──
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // ── Reports tab ──
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // ── Fetch groups + students ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        getGroupsApi().catch(() => ({ data: [] })),
        getUsersApi().catch(() => []),
      ]);
      const groupsList = Array.isArray(groupsRes?.data) ? groupsRes.data : (Array.isArray(groupsRes) ? groupsRes : []);
      setGroups(groupsList.map((g) => ({
        id: g.group_id || g.id,
        name: g.group_name || g.name || `Group ${g.group_id}`,
        project: g.project_title || g.project_name || '',
        memberCount: g.member_count || g.group_members?.length || 0,
      })));
      const rawUsers = Array.isArray(usersRes?.data) ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []);
      setAllUsers(rawUsers);

      // Fetch members for all groups
      const allStudents = [];
      for (const g of groupsList) {
        try {
          const membersRes = await getMembersApi(g.group_id || g.id);
          const membersList = Array.isArray(membersRes?.data) ? membersRes.data : (Array.isArray(membersRes) ? membersRes : []);
          membersList.forEach((m) => {
            allStudents.push({
              id: m.user_id || m.id,
              name: m.full_name || m.name || m.email,
              email: m.email || '',
              groupId: g.group_id || g.id,
              groupName: g.group_name || g.name || `Group ${g.group_id}`,
              role: m.role || 'Member',
            });
          });
        } catch { /* skip group */ }
      }
      setStudents(allStudents);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fetch Jira issues (on tab switch or group filter change) ──
  const fetchIssues = useCallback(async () => {
    const targetGroups = filterGroup === 'all' ? groups : groups.filter((g) => g.id === parseInt(filterGroup));
    if (targetGroups.length === 0) { setIssues([]); return; }
    setIssuesLoading(true);
    try {
      const allIssues = [];
      let failedGroups = 0;
      for (const g of targetGroups) {
        try {
          const res = await getJiraIssuesApi(g.id);
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          list.forEach((issue) => allIssues.push({
            ...issue,
            groupName: g.name,
            groupId: g.id,
            uiStatus: STATUS_MAP[issue.status] || 'todo',
            uiPriority: PRIORITY_MAP[issue.priority] || 'medium',
          }));
        } catch {
          failedGroups += 1;
        }
      }
      setIssues(allIssues);

      if (failedGroups > 0) {
        toast.warning(
          `${failedGroups}/${targetGroups.length} nhóm chưa lấy được Jira issues. Kiểm tra Jira config hoặc chạy sync.`,
        );
      }
    } catch {
      toast.error('Không thể tải Jira issues');
    } finally {
      setIssuesLoading(false);
    }
  }, [groups, filterGroup]);

  // ── Fetch reports ──
  const fetchReports = useCallback(async () => {
    const targetGroups = filterGroup === 'all' ? groups : groups.filter((g) => g.id === parseInt(filterGroup));
    if (targetGroups.length === 0) { setReports([]); return; }
    setReportsLoading(true);
    try {
      const allReports = [];
      for (const g of targetGroups) {
        try {
          const res = await getReportsApi(g.id);
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          list.forEach((r) => allReports.push({ ...r, groupName: g.name, groupId: g.id }));
        } catch { /* skip */ }
      }
      setReports(allReports);
    } catch {
      toast.error('Không thể tải reports');
    } finally {
      setReportsLoading(false);
    }
  }, [groups, filterGroup]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'issues' && groups.length > 0) fetchIssues();
    if (activeTab === 'reports' && groups.length > 0) fetchReports();
  }, [activeTab, groups, fetchIssues, fetchReports]);

  // ── Manual Sync ──
  const handleSync = async () => {
    const targetGroups = filterGroup === 'all' ? groups : groups.filter((g) => g.id === parseInt(filterGroup));
    if (targetGroups.length === 0) return;
    setSyncing(true);
    try {
      let successCount = 0;
      let failedCount = 0;
      for (const g of targetGroups) {
        try {
          await manualSyncApi(g.id);
          successCount += 1;
        } catch {
          failedCount += 1;
        }
      }

      if (failedCount === 0) {
        toast.success('Đồng bộ dữ liệu thành công!');
      } else if (successCount > 0) {
        toast.warning(`Đồng bộ một phần: ${successCount} thành công, ${failedCount} thất bại.`);
      } else {
        toast.error('Đồng bộ thất bại cho tất cả nhóm đã chọn');
      }

      if (activeTab === 'issues') fetchIssues();
      if (activeTab === 'students') fetchData();
    } catch {
      toast.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  // ── Add member handler ──
  const handleAddMember = async () => {
    if (!addMemberUserId || !addMemberGroupId) return;
    setAddMemberLoading(true);
    try {
      await addMemberApi(addMemberGroupId, { user_id: Number(addMemberUserId) });
      toast.success('Thêm thành viên thành công!');
      setAddMemberOpen(false);
      setAddMemberUserId('');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Thêm thành viên thất bại');
    } finally {
      setAddMemberLoading(false);
    }
  };

  // ── Remove member handler ──
  const handleRemoveMember = async (groupId, userId, name) => {
    if (!window.confirm(`Xoá "${name}" khỏi nhóm?`)) return;
    try {
      await removeMemberApi(groupId, userId);
      toast.success('Đã xoá thành viên');
      fetchData();
    } catch {
      toast.error('Xoá thành viên thất bại');
    }
  };

  // ── Filter students ──
  const filteredStudents = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGroup = filterGroup === 'all' || s.groupId === parseInt(filterGroup);
    return matchSearch && matchGroup;
  });

  // Tabs config
  const tabs = [
    { key: 'students', label: 'Students', icon: Users },
    { key: 'issues', label: 'Jira Issues', icon: ListTodo },
    { key: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lecturer Console</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý nhóm, sinh viên, giám sát Jira issues và báo cáo tiến độ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Groups</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{groups.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <UserCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{students.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
            <ListTodo className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTab === 'issues' ? issues.length : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle>
            <FileBarChart className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTab === 'reports' ? reports.length : '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation + Group Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border bg-muted p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-full sm:w-50">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ══════════════════ STUDENTS TAB ══════════════════ */}
      {activeTab === 'students' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student Management</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Button size="sm" onClick={() => { setAddMemberOpen(true); setAddMemberGroupId(groups[0]?.id); }}>
                <Plus className="mr-1 h-4 w-4" /> Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
              </div>
            ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.map((s) => (
                    <TableRow key={`${s.groupId}-${s.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell><Badge variant="outline">{s.groupName}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={s.role === 'Leader' ? 'default' : 'secondary'}>{s.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remove from group"
                          onClick={() => handleRemoveMember(s.groupId, s.id, s.name)}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════ JIRA ISSUES TAB ══════════════════ */}
      {activeTab === 'issues' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Jira Issues ({issues.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchIssues} disabled={issuesLoading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${issuesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {issuesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
              </div>
            ) : issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ListTodo className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No Jira issues found</p>
                <p className="text-sm text-muted-foreground">Try syncing or selecting a different group</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Issue Key</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => {
                      const cfg = STATUS_CONFIG[issue.uiStatus] || STATUS_CONFIG.todo;
                      const Icon = cfg.icon;
                      return (
                        <TableRow key={`${issue.groupId}-${issue.issue_key}`}>
                          <TableCell className="font-mono text-xs text-primary">{issue.issue_key}</TableCell>
                          <TableCell className="font-medium max-w-75 truncate">{issue.summary}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{issue.groupName}</Badge></TableCell>
                          <TableCell className="text-sm">{issue.assignee_email || '—'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                              <Icon size={12} />
                              {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{issue.priority || '—'}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{issue.issue_type || '—'}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════ REPORTS TAB ══════════════════ */}
      {activeTab === 'reports' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contribution Reports ({reports.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchReports} disabled={reportsLoading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${reportsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileBarChart className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No reports yet</p>
                <p className="text-sm text-muted-foreground">Reports appear when Leaders generate them</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Tasks Completed</TableHead>
                      <TableHead>Commits</TableHead>
                      <TableHead>Lines Changed</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Badge variant="outline">{r.groupName}</Badge></TableCell>
                        <TableCell className="font-medium">{r.user?.full_name || r.user_id || '—'}</TableCell>
                        <TableCell className="text-center">{r.tasks_completed ?? '—'}</TableCell>
                        <TableCell className="text-center">{r.commit_count ?? '—'}</TableCell>
                        <TableCell className="text-center">{r.lines_changed ?? '—'}</TableCell>
                        <TableCell>
                          {r.contribution_score != null && (
                            <Badge variant={r.contribution_score >= 70 ? 'default' : r.contribution_score >= 40 ? 'secondary' : 'destructive'}>
                              {r.contribution_score}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.generated_at ? new Date(r.generated_at).toLocaleDateString('vi-VN') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════ ADD MEMBER DIALOG ══════════════════ */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm thành viên vào nhóm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Chọn nhóm</Label>
              <Select value={String(addMemberGroupId || '')} onValueChange={(v) => setAddMemberGroupId(Number(v))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chọn người dùng</Label>
              <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter((u) => !students.some((s) => s.id === (u.userId || u.user_id) && s.groupId === addMemberGroupId))
                    .map((u) => (
                      <SelectItem key={u.userId || u.user_id} value={String(u.userId || u.user_id)}>
                        {u.username || u.full_name || u.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Hủy</Button>
            <Button onClick={handleAddMember} disabled={addMemberLoading || !addMemberUserId}>
              {addMemberLoading ? 'Đang thêm...' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
