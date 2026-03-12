import { useState } from 'react';
import {
  GitCommit,
  CheckCircle2,
  TrendingUp,
  Award,
  Calendar,
  FileCode,
  Plus,
  Minus,
  ArrowUpRight,
  BarChart3,
  Clock,
  Target,
  CircleDot,
  Timer,
  CircleCheck,
  CirclePause,
} from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const taskStats = {
  total: 7,
  todo: 2,
  inProgress: 2,
  inReview: 1,
  done: 2,
  completionRate: 28.6, // 2/7
  sprintPoints: { completed: 3, total: 21 },
};

const recentTasks = [
  {
    id: 'SWP-104',
    title: 'Setup CI/CD pipeline with GitHub Actions',
    status: 'done',
    completedDate: '2026-03-05',
    storyPoints: 2,
  },
  {
    id: 'SWP-107',
    title: 'Fix CORS configuration for frontend',
    status: 'done',
    completedDate: '2026-03-04',
    storyPoints: 1,
  },
  {
    id: 'SWP-101',
    title: 'Implement Login API endpoint',
    status: 'in_progress',
    completedDate: null,
    storyPoints: 5,
  },
  {
    id: 'SWP-106',
    title: 'Create API documentation with Swagger',
    status: 'in_progress',
    completedDate: null,
    storyPoints: 2,
  },
  {
    id: 'SWP-102',
    title: 'Design Database Schema for User module',
    status: 'in_review',
    completedDate: null,
    storyPoints: 3,
  },
];

const commitHistory = [
  {
    sha: 'a1b2c3d',
    message: 'feat(auth): implement JWT login endpoint',
    date: '2026-03-07',
    time: '14:30',
    filesChanged: 4,
    additions: 156,
    deletions: 12,
    qualityScore: 92,
    branch: 'feature/login-api',
  },
  {
    sha: 'e4f5g6h',
    message: 'fix(cors): add allowed origins for frontend',
    date: '2026-03-06',
    time: '16:45',
    filesChanged: 2,
    additions: 24,
    deletions: 3,
    qualityScore: 88,
    branch: 'hotfix/cors',
  },
  {
    sha: 'i7j8k9l',
    message: 'feat(db): create User entity and repository',
    date: '2026-03-06',
    time: '10:20',
    filesChanged: 5,
    additions: 203,
    deletions: 0,
    qualityScore: 95,
    branch: 'feature/user-schema',
  },
  {
    sha: 'm1n2o3p',
    message: 'docs(api): add Swagger annotations to AuthController',
    date: '2026-03-05',
    time: '15:10',
    filesChanged: 3,
    additions: 87,
    deletions: 5,
    qualityScore: 85,
    branch: 'feature/swagger-docs',
  },
  {
    sha: 'q4r5s6t',
    message: 'ci: setup GitHub Actions workflow',
    date: '2026-03-04',
    time: '09:30',
    filesChanged: 2,
    additions: 78,
    deletions: 0,
    qualityScore: 90,
    branch: 'feature/ci-cd',
  },
  {
    sha: 'u7v8w9x',
    message: 'feat(auth): add password hashing with bcrypt',
    date: '2026-03-03',
    time: '11:00',
    filesChanged: 3,
    additions: 65,
    deletions: 8,
    qualityScore: 91,
    branch: 'feature/login-api',
  },
  {
    sha: 'y1z2a3b',
    message: 'refactor: extract common validation utils',
    date: '2026-03-02',
    time: '14:15',
    filesChanged: 6,
    additions: 112,
    deletions: 45,
    qualityScore: 87,
    branch: 'refactor/validation',
  },
];

// Daily commit data for the last 7 days
const dailyCommits = [
  { day: 'Mon', date: '03/02', count: 1 },
  { day: 'Tue', date: '03/03', count: 1 },
  { day: 'Wed', date: '03/04', count: 1 },
  { day: 'Thu', date: '03/05', count: 1 },
  { day: 'Fri', date: '03/06', count: 2 },
  { day: 'Sat', date: '03/07', count: 1 },
  { day: 'Sun', date: '03/08', count: 0 },
];

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
  const [timeRange, setTimeRange] = useState('week');

  const totalCommits = commitHistory.length;
  const avgQuality = Math.round(
    commitHistory.reduce((sum, c) => sum + c.qualityScore, 0) / totalCommits,
  );
  const totalAdditions = commitHistory.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commitHistory.reduce((sum, c) => sum + c.deletions, 0);
  const maxCommits = Math.max(...dailyCommits.map((d) => d.count), 1);

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
        description="Personal statistics for your tasks and commits."
        actions={
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="sprint">This Sprint</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        }
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
                <ArrowUpRight size={14} />
                View on GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
