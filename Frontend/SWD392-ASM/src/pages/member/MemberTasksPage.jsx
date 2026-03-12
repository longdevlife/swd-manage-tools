import { useState } from 'react';
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  Calendar,
  ArrowUpRight,
  Filter,
  CircleDot,
  Timer,
  CircleCheck,
  CirclePause,
} from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockTasks = [
  {
    id: 'SWP-101',
    title: 'Implement Login API endpoint',
    description:
      'Create RESTful API endpoint for user authentication using JWT tokens. Include input validation, password hashing with bcrypt, and proper error handling for invalid credentials.',
    sprint: 'Sprint 3',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-03-12',
    assignee: 'Nguyen Van A',
    storyPoints: 5,
    labels: ['backend', 'auth'],
    createdDate: '2026-03-01',
    comments: [
      {
        author: 'Team Leader',
        text: 'Please use Spring Security for this module',
        date: '2026-03-02',
      },
      {
        author: 'Nguyen Van A',
        text: 'Started coding, expect to finish by Wednesday',
        date: '2026-03-03',
      },
    ],
  },
  {
    id: 'SWP-102',
    title: 'Design Database Schema for User module',
    description:
      'Design and implement database schema for the User module including tables for users, roles, and permissions with proper foreign key constraints.',
    sprint: 'Sprint 3',
    priority: 'urgent',
    status: 'in_review',
    dueDate: '2026-03-10',
    assignee: 'Nguyen Van A',
    storyPoints: 3,
    labels: ['database', 'design'],
    createdDate: '2026-02-28',
    comments: [{ author: 'Lecturer', text: 'Remember to normalize to 3NF', date: '2026-03-01' }],
  },
  {
    id: 'SWP-103',
    title: 'Write unit tests for Auth Service',
    description:
      'Write comprehensive unit tests for the Authentication Service layer covering login, registration, token refresh, and password reset flows.',
    sprint: 'Sprint 3',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-03-15',
    assignee: 'Nguyen Van A',
    storyPoints: 3,
    labels: ['testing'],
    createdDate: '2026-03-03',
    comments: [],
  },
  {
    id: 'SWP-104',
    title: 'Setup CI/CD pipeline with GitHub Actions',
    description:
      'Configure GitHub Actions workflow for continuous integration. Include build, test, and lint stages. Deploy to staging on merge to develop branch.',
    sprint: 'Sprint 2',
    priority: 'low',
    status: 'done',
    dueDate: '2026-03-05',
    assignee: 'Nguyen Van A',
    storyPoints: 2,
    labels: ['devops'],
    createdDate: '2026-02-20',
    comments: [{ author: 'Team Leader', text: 'LGTM! Merged to develop', date: '2026-03-05' }],
  },
  {
    id: 'SWP-105',
    title: 'Implement User Registration flow',
    description:
      'Build the complete user registration flow including form validation, email verification, and redirect to login page after successful registration.',
    sprint: 'Sprint 3',
    priority: 'high',
    status: 'todo',
    dueDate: '2026-03-18',
    assignee: 'Nguyen Van A',
    storyPoints: 5,
    labels: ['frontend', 'auth'],
    createdDate: '2026-03-04',
    comments: [],
  },
  {
    id: 'SWP-106',
    title: 'Create API documentation with Swagger',
    description:
      'Add Swagger/OpenAPI annotations to all REST endpoints. Configure Swagger UI for easy API exploration and testing.',
    sprint: 'Sprint 3',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2026-03-14',
    assignee: 'Nguyen Van A',
    storyPoints: 2,
    labels: ['documentation'],
    createdDate: '2026-03-05',
    comments: [],
  },
  {
    id: 'SWP-107',
    title: 'Fix CORS configuration for frontend',
    description:
      'Resolve CORS issues preventing the React frontend from communicating with the Spring Boot backend. Configure allowed origins, headers, and methods.',
    sprint: 'Sprint 2',
    priority: 'urgent',
    status: 'done',
    dueDate: '2026-03-04',
    assignee: 'Nguyen Van A',
    storyPoints: 1,
    labels: ['bugfix', 'backend'],
    createdDate: '2026-03-02',
    comments: [
      {
        author: 'Team Leader',
        text: 'Urgent fix — frontend team is blocked',
        date: '2026-03-02',
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo: { label: 'To Do', variant: 'secondary', icon: CircleDot, color: 'text-muted-foreground' },
  in_progress: {
    label: 'In Progress',
    variant: 'default',
    icon: Timer,
    color: 'text-[var(--warning)]',
  },
  in_review: {
    label: 'In Review',
    variant: 'outline',
    icon: CirclePause,
    color: 'text-[var(--info)]',
  },
  done: { label: 'Done', variant: 'secondary', icon: CircleCheck, color: 'text-[var(--success)]' },
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700 border-red-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: 'Low', className: 'bg-green-100 text-green-700 border-green-200' },
};

function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon size={12} />
      {config.label}
    </Badge>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdue(dateStr, status) {
  if (status === 'done') return false;
  return new Date(dateStr) < new Date();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberTasksPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  // Filter logic
  const filteredTasks = mockTasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = [
    {
      title: 'Total Tasks',
      value: mockTasks.length,
      icon: ListTodo,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtext: 'Assigned to you',
      trend: '+2.4%',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'In Progress',
      value: mockTasks.filter((t) => t.status === 'in_progress').length,
      icon: Clock,
      color: 'text-[var(--warning)]',
      bgColor: 'bg-[var(--warning)]/10',
      subtext: 'Actively working',
      trend: '+12.5%',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Completed',
      value: mockTasks.filter((t) => t.status === 'done').length,
      icon: CheckCircle2,
      color: 'text-[var(--success)]',
      bgColor: 'bg-[var(--success)]/10',
      subtext: 'This sprint',
      trend: '+5.7%',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Overdue',
      value: mockTasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      subtext: 'Needs attention',
      trend: '-1.2%',
      trendColor: 'bg-emerald-100 text-emerald-700', // Giảm overdue là tốt nên màu xanh
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="My Tasks" description="List of tasks assigned to you from Jira." />

      {/* Stats */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
            {stats.map((stat) => (
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

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter size={16} />
              <span className="font-medium">Filters:</span>
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search tasks..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Assigned Tasks
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''})
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="w-28">Sprint</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-16 text-center">SP</TableHead>
                <TableHead className="w-20 text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No tasks found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {task.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {task.labels.map((l) => (
                            <span
                              key={l}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{task.sprint}</span>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-muted-foreground" />
                        <span
                          className={`text-sm ${isOverdue(task.dueDate, task.status) ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                        {task.storyPoints}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(v) => !v && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="font-mono text-sm text-primary">{selectedTask?.id}</span>
              <span>{selectedTask?.title}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-5">
              {/* Meta info */}
              <div className="flex flex-wrap gap-3">
                <StatusBadge status={selectedTask.status} />
                <PriorityBadge priority={selectedTask.priority} />
                <Badge variant="outline" className="gap-1">
                  <Calendar size={12} />
                  {formatDate(selectedTask.dueDate)}
                </Badge>
                <Badge variant="outline">{selectedTask.sprint}</Badge>
                <Badge variant="outline" className="font-mono">
                  SP: {selectedTask.storyPoints}
                </Badge>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Description</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {selectedTask.description}
                </p>
              </div>

              {/* Labels */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Labels</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTask.labels.map((l) => (
                    <Badge key={l} variant="secondary" className="text-xs">
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Comments */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">
                  Comments ({selectedTask.comments.length})
                </h4>
                {selectedTask.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedTask.comments.map((c, i) => (
                      <div key={i} className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{c.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(c.date)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Jira Link */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpRight size={14} />
                  View on Jira
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
