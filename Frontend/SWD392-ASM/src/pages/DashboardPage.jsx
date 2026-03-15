import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/stores/authSlice';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Users,
  GitCommitHorizontal,
  AlertCircle,
  ArrowUpRight,
  Activity,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { getGroupsApi, getMembersApi } from '@/features/groups/api/groupsApi';
import { getJiraIssuesApi } from '@/features/jira/api/jiraApi';
import { getCommitsApi } from '@/features/github/api/githubApi';
import { manualSyncApi } from '@/features/sync/api/syncApi';

// ─── Status Mapping ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  'To Do': 'todo',
  'In Progress': 'in_progress',
  'In Review': 'in_review',
  Done: 'done',
  Closed: 'done',
  Resolved: 'done',
};

const STATUS_BADGE = {
  todo: { label: 'To Do', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-700' },
  in_review: { label: 'In Review', className: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', className: 'bg-green-100 text-green-700' },
};

export function DashboardPage() {
  const user = useSelector(selectCurrentUser);
  const activeGroupId = useSelector((state) => state.ui?.activeGroupId);
  const groupId = activeGroupId || user?.groups?.[0]?.group_id;
  const role = user?.role?.toLowerCase() || 'member';

  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    completed: 0,
    members: 0,
    overdue: 0,
    commits: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentCommits, setRecentCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Full sync: Jira + GitHub
  const handleFullSync = async () => {
    if (!groupId) { toast.warning('Bạn chưa thuộc nhóm nào. Liên hệ Admin để được thêm vào nhóm.'); return; }
    setSyncing(true);
    try {
      await manualSyncApi(groupId);
      toast.success('Đồng bộ dữ liệu thành công!');
      fetchDashboard();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const fetchDashboard = useCallback(async () => {
    if (!groupId && role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Admin: tổng groups + members | Others: issues + members + commits
      if (role === 'admin') {
        const groupsRes = await getGroupsApi().catch(() => ({ data: [] }));
        const groupsList = Array.isArray(groupsRes?.data)
          ? groupsRes.data
          : Array.isArray(groupsRes)
            ? groupsRes
            : [];
        let totalMembers = 0;
        for (const g of groupsList.slice(0, 10)) {
          try {
            const m = await getMembersApi(g.group_id || g.id);
            const list = Array.isArray(m?.data) ? m.data : Array.isArray(m) ? m : [];
            totalMembers += list.length;
          } catch {
            /* skip */
          }
        }
        setStats({
          totalTasks: 0,
          inProgress: 0,
          completed: 0,
          members: totalMembers,
          overdue: groupsList.length,
          commits: 0,
        });
      } else {
        const [issuesRes, membersRes, commitsRes] = await Promise.all([
          getJiraIssuesApi(groupId).catch(() => ({ data: [] })),
          getMembersApi(groupId).catch(() => ({ data: [] })),
          getCommitsApi(groupId).catch(() => ({ data: [] })),
        ]);
        const issues = Array.isArray(issuesRes?.data)
          ? issuesRes.data
          : Array.isArray(issuesRes)
            ? issuesRes
            : [];
        const members = Array.isArray(membersRes?.data)
          ? membersRes.data
          : Array.isArray(membersRes)
            ? membersRes
            : [];
        const commits = Array.isArray(commitsRes?.data)
          ? commitsRes.data
          : Array.isArray(commitsRes)
            ? commitsRes
            : [];

        // Filter by user email for member role
        const myIssues =
          role === 'member' && user?.email
            ? issues.filter((i) => i.assignee_email === user.email)
            : issues;

        const mapped = myIssues.map((i) => ({
          ...i,
          _status: STATUS_MAP[i.status] || 'todo',
        }));

        setStats({
          totalTasks: mapped.length,
          inProgress: mapped.filter((t) => t._status === 'in_progress').length,
          completed: mapped.filter((t) => t._status === 'done').length,
          members: members.length,
          overdue: 0,
          commits: commits.length,
        });

        // Recent tasks (last 5)
        setRecentTasks(
          mapped.slice(0, 5).map((i) => ({
            key: i.issue_key,
            summary: i.summary,
            status: i._status,
            assignee: i.assignee_email || 'Unassigned',
          })),
        );

        // Recent commits (last 5)
        setRecentCommits(
          commits.slice(0, 5).map((c) => ({
            message: c.message || c.commit_message || '',
            author: c.author_name || c.author || '',
            date: c.committed_at || c.created_at || '',
          })),
        );
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [groupId, role, user?.email]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Build stat cards based on role
  const statCards =
    role === 'admin'
      ? [
          {
            title: 'Total Groups',
            value: stats.overdue,
            icon: Users,
            color: 'text-primary',
          },
          {
            title: 'Total Members',
            value: stats.members,
            icon: Users,
            color: 'text-[var(--info)]',
          },
        ]
      : [
          {
            title: 'Total Tasks',
            value: stats.totalTasks,
            icon: ListTodo,
            color: 'text-primary',
          },
          {
            title: 'In Progress',
            value: stats.inProgress,
            icon: Clock,
            color: 'text-[var(--warning)]',
          },
          {
            title: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            color: 'text-[var(--success)]',
          },
          {
            title: 'Members',
            value: stats.members,
            icon: Users,
            color: 'text-[var(--info)]',
          },
        ];

  const greeting =
    role === 'admin'
      ? 'Admin Dashboard'
      : role === 'lecturer'
        ? 'Lecturer Dashboard'
        : role === 'leader'
          ? 'Leader Dashboard'
          : 'My Dashboard';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Loading data...'
              : role === 'admin'
                ? 'System overview and management'
                : `Group overview — ${stats.totalTasks} tasks, ${stats.members} members`}
          </p>
        </div>
        {role !== 'admin' && (
          <Button variant="outline" onClick={handleFullSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
            {recentTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Last {recentTasks.length} issues
              </span>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ListTodo className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {role === 'admin' ? 'Admin view — no task data' : 'No tasks found'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => {
                  const badge = STATUS_BADGE[task.status] || STATUS_BADGE.todo;
                  return (
                    <div
                      key={task.key}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{task.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.key} · {task.assignee}
                        </p>
                      </div>
                      <Badge variant="outline" className={`ml-3 shrink-0 ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Activity / Recent Commits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Team Activity
            </CardTitle>
            {recentCommits.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {stats.commits} total commits
              </span>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentCommits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <GitCommitHorizontal className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {role === 'admin'
                    ? 'Admin view — no commit data'
                    : 'No recent commits found'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCommits.map((commit, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border px-4 py-3">
                    <GitCommitHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{commit.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {commit.author}
                        {commit.date &&
                          ` · ${new Date(commit.date).toLocaleDateString('vi-VN')}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
