import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  GitCommit,
  CheckCircle2,
  TrendingUp,
  Award,
  Calendar,
  FileCode,
  Plus,
  Minus,
  BarChart3,
  Target,
  CircleDot,
  Timer,
  CircleCheck,
  CirclePause,
} from 'lucide-react';

import { selectCurrentUser } from '@/stores/authSlice';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { getJiraIssuesApi } from '@/features/jira/api/jiraApi';
import { getCommitsApi, getCommitStatsApi } from '@/features/github/api/githubApi';
import { getMyReportApi } from '@/features/reports/api/reportsApi';

// ─── Status Mapping ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  'To Do': 'todo',
  'In Progress': 'in_progress',
  'In Review': 'in_review',
  Done: 'done',
  Closed: 'done',
  Resolved: 'done',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo: { label: 'To Do', icon: CircleDot, color: 'text-muted-foreground', bg: 'bg-muted' },
  in_progress: {
    label: 'In Progress',
    icon: Timer,
    color: 'text-[var(--warning)]',
    bg: 'bg-[var(--warning)]/10',
  },
  in_review: {
    label: 'In Review',
    icon: CirclePause,
    color: 'text-[var(--info)]',
    bg: 'bg-[var(--info)]/10',
  },
  done: {
    label: 'Done',
    icon: CircleCheck,
    color: 'text-[var(--success)]',
    bg: 'bg-[var(--success)]/10',
  },
};

function getQualityColor(score) {
  if (score >= 90) return 'text-[var(--success)]';
  if (score >= 75) return 'text-[var(--warning)]';
  return 'text-destructive';
}

function getQualityBg(score) {
  if (score >= 90) return 'bg-[var(--success)]/10';
  if (score >= 75) return 'bg-[var(--warning)]/10';
  return 'bg-destructive/10';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberStatsPage() {
  const user = useSelector(selectCurrentUser);
  const activeGroupId = useSelector((state) => state.ui?.activeGroupId);
  const groupId = activeGroupId || user?.groups?.[0]?.group_id;
  const [taskStats, setTaskStats] = useState({ total: 0, todo: 0, inProgress: 0, inReview: 0, done: 0, completionRate: 0, sprintPoints: { completed: 0, total: 0 } });
  const [recentTasks, setRecentTasks] = useState([]);
  const [commitHistory, setCommitHistory] = useState([]);
  const [dailyCommits, setDailyCommits] = useState([]);
  const [myReport, setMyReport] = useState(null);
  const [commitStats, setCommitStats] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    (async () => {
      try {
        // Fetch Jira issues for this user
        const issuesRes = await getJiraIssuesApi(groupId).catch(() => ({ data: [] }));
        const allIssues = Array.isArray(issuesRes?.data) ? issuesRes.data : Array.isArray(issuesRes) ? issuesRes : [];
        const myIssues = user?.email ? allIssues.filter((i) => i.assignee_email === user.email) : allIssues;
        const mapped = myIssues.map((i) => ({ ...i, _status: STATUS_MAP[i.status] || 'todo' }));
        const todo = mapped.filter((t) => t._status === 'todo').length;
        const inProg = mapped.filter((t) => t._status === 'in_progress').length;
        const inRev = mapped.filter((t) => t._status === 'in_review').length;
        const done = mapped.filter((t) => t._status === 'done').length;
        const total = mapped.length;
        if (cancelled) return;
        setTaskStats({
          total,
          todo,
          inProgress: inProg,
          inReview: inRev,
          done,
          completionRate: total > 0 ? Math.round((done / total) * 100 * 10) / 10 : 0,
          sprintPoints: { completed: done, total },
        });
        setRecentTasks(mapped.slice(0, 5).map((i) => ({
          id: i.issue_key || i.id,
          title: i.summary || '',
          status: i._status,
          completedDate: i._status === 'done' ? i.updated_at || null : null,
          storyPoints: 1,
        })));

        // Fetch GitHub commits
        const commitsRes = await getCommitsApi(groupId).catch(() => ({ data: [] }));
        const commits = Array.isArray(commitsRes?.data) ? commitsRes.data : Array.isArray(commitsRes) ? commitsRes : [];
        const myCommits = user?.email ? commits.filter((c) => (c.author_email || c.author || '').includes(user.email.split('@')[0])) : commits;
        if (cancelled) return;
        setCommitHistory(myCommits.slice(0, 7).map((c) => {
          const d = c.committed_at || c.created_at || '';
          const dateObj = d ? new Date(d) : null;
          return {
            sha: (c.sha || c.commit_sha || '').slice(0, 7),
            message: c.message || c.commit_message || '',
            date: dateObj ? dateObj.toISOString().split('T')[0] : '',
            time: dateObj ? dateObj.toTimeString().slice(0, 5) : '',
            filesChanged: c.files_changed || 0,
            additions: c.additions || 0,
            deletions: c.deletions || 0,
            qualityScore: 85,
            branch: c.branch || 'main',
          };
        }));

        // Compute daily commits (last 7 days)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daily = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
          const dayKey = d.toISOString().split('T')[0];
          const count = myCommits.filter((c) => (c.committed_at || c.created_at || '').startsWith(dayKey)).length;
          return { day: days[d.getDay()], date: dateStr, count };
        });
        setDailyCommits(daily);

        // Fetch personal contribution report
        const reportRes = await getMyReportApi(groupId).catch(() => null);
        if (!cancelled && (reportRes?.data || reportRes)) {
          setMyReport(reportRes?.data ?? reportRes);
        }

        // Fetch commit stats comparison
        const statsRes = await getCommitStatsApi(groupId).catch(() => null);
        if (!cancelled && (statsRes?.data || statsRes)) {
          setCommitStats(statsRes?.data ?? statsRes);
        }
      } catch { /* empty */ }
    })();
    return () => { cancelled = true; };
  }, [groupId, user?.email]);
  const totalCommits = commitHistory.length;
  const avgQuality = totalCommits > 0 ? Math.round(
    commitHistory.reduce((sum, c) => sum + c.qualityScore, 0) / totalCommits,
  ) : 0;
  const totalAdditions = commitHistory.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commitHistory.reduce((sum, c) => sum + c.deletions, 0);
  const maxCommits = Math.max(...dailyCommits.map((d) => d.count), 1);
  const myContribution = myReport?.contribution_percentage?.commits || 0;
  const teamAvgCommits = commitStats?.average_commits || 0;

  // Overview stats
  const overviewStats = [
    {
      title: 'Weekly Commits',
      value: totalCommits,
      icon: GitCommit,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtext: `+${totalAdditions} / -${totalDeletions} lines`,
      trend: '+15.2%',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Tasks Completed',
      value: `${taskStats.done}/${taskStats.total}`,
      icon: CheckCircle2,
      color: 'text-[var(--success)]',
      bgColor: 'bg-[var(--success)]/10',
      subtext: `Current Sprint`,
      trend: '+2',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Commit Quality',
      value: `${avgQuality}%`,
      icon: Award,
      color: getQualityColor(avgQuality),
      bgColor: getQualityBg(avgQuality),
      subtext: 'Average Score',
      trend: '+4.5%',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Completion Rate',
      value: `${taskStats.completionRate}%`,
      icon: Target,
      color: 'text-[var(--info)]',
      bgColor: 'bg-[var(--info)]/10',
      subtext: `${taskStats.sprintPoints.completed}/${taskStats.sprintPoints.total} SP`,
      trend: '-1.2%',
      trendColor: 'bg-rose-100 text-rose-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Statistics"
        description={`Personal statistics • Contribution: ${myContribution}% • Team avg: ${teamAvgCommits} commits`}
      />

      {/* Overview Stats */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
            {overviewStats.map((stat) => (
              <div key={stat.title} className="flex-1 p-6">
                <div className="flex flex-row items-center justify-between pb-2">
                  <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.bgColor}`}
                  >
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {stat.subtext && (
                      <span className="text-xs text-muted-foreground">{stat.subtext}</span>
                    )}
                    {stat.trend && (
                      <span
                        className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${stat.trendColor}`}
                      >
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content — Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Task Statistics ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Task Breakdown
            </CardTitle>
            <CardDescription>Task distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Breakdown Bars */}
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const countMap = {
                todo: taskStats.todo,
                in_progress: taskStats.inProgress,
                in_review: taskStats.inReview,
                done: taskStats.done,
              };
              const count = countMap[key];
              const pct = taskStats.total > 0 ? (count / taskStats.total) * 100 : 0;
              const Icon = config.icon;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={config.color} />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <span className="font-semibold">
                      {count}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          key === 'done'
                            ? 'var(--success)'
                            : key === 'in_progress'
                              ? 'var(--warning)'
                              : key === 'in_review'
                                ? 'var(--info)'
                                : 'var(--muted-foreground)',
                        opacity: key === 'todo' ? 0.4 : 1,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <Separator className="my-4" />

            {/* Sprint Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Sprint Progress</span>
                <span className="text-muted-foreground">
                  {taskStats.sprintPoints.completed}/{taskStats.sprintPoints.total} SP
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(taskStats.sprintPoints.completed / taskStats.sprintPoints.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Recent Completed Tasks */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Recent Tasks</h4>
              <div className="space-y-2">
                {recentTasks.map((task) => {
                  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/30"
                    >
                      <Icon size={16} className={cfg.color} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.id} · {task.storyPoints} SP
                          {task.completedDate &&
                            ` · Completed on ${formatDate(task.completedDate)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Commit Statistics ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCommit size={18} className="text-primary" />
              Commit Statistics
            </CardTitle>
            <CardDescription>GitHub commit frequency and quality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Commit Frequency Chart */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Commit Frequency (last 7 days)</h4>
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {dailyCommits.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-semibold">{d.count}</span>
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all duration-300 hover:bg-primary"
                      style={{
                        height: d.count > 0 ? `${(d.count / maxCommits) * 80}px` : '4px',
                        opacity: d.count > 0 ? 1 : 0.2,
                        minHeight: '4px',
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quality Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-primary">{totalCommits}</p>
                <p className="text-[11px] text-muted-foreground">Total Commits</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className={`text-lg font-bold ${getQualityColor(avgQuality)}`}>{avgQuality}%</p>
                <p className="text-[11px] text-muted-foreground">Avg Quality</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-[var(--info)]">
                  {totalAdditions + totalDeletions}
                </p>
                <p className="text-[11px] text-muted-foreground">Lines Changed</p>
              </div>
            </div>

            <Separator />

            {/* Commit History */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Commit History</h4>
              <div className="space-y-2">
                {commitHistory.map((commit) => (
                  <div
                    key={commit.sha}
                    className="group rounded-lg border p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{commit.message}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {formatDate(commit.date)} {commit.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileCode size={11} />
                            {commit.filesChanged} files
                          </span>
                          <span className="flex items-center gap-1 text-[var(--success)]">
                            <Plus size={11} />
                            {commit.additions}
                          </span>
                          <span className="flex items-center gap-1 text-destructive">
                            <Minus size={11} />
                            {commit.deletions}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {commit.sha}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getQualityBg(commit.qualityScore)} ${getQualityColor(commit.qualityScore)}`}
                        >
                          {commit.qualityScore}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {commit.branch}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub Link */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                View on GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
