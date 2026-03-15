import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/stores/authSlice';
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
  RefreshCw,
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

import { getJiraIssuesApi, updateIssueStatusApi, syncJiraIssuesApi } from '@/features/jira/api/jiraApi';
import { toast } from 'sonner';

// ─── Data Mapping ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  'To Do': 'todo', 'In Progress': 'in_progress', 'In Review': 'in_review',
  'Done': 'done', 'Closed': 'done', 'Resolved': 'done',
};
const PRIORITY_MAP = {
  Highest: 'urgent', High: 'high', Medium: 'medium', Low: 'low', Lowest: 'low',
};
const mapIssue = (issue) => ({
  id: issue.issue_key,
  title: issue.summary,
  description: issue.issue_type || '',
  sprint: '',
  priority: PRIORITY_MAP[issue.priority] || 'medium',
  status: STATUS_MAP[issue.status] || 'todo',
  dueDate: '',
  assignee: issue.assignee_email || 'Unassigned',
  storyPoints: 0,
  labels: issue.issue_type ? [issue.issue_type] : [],
  createdDate: issue.created_at,
  comments: [],
});

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
  const user = useSelector(selectCurrentUser);
  const activeGroupId = useSelector((state) => state.ui?.activeGroupId);
  const groupId = activeGroupId || user?.groups?.[0]?.group_id;

  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await getJiraIssuesApi(groupId);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      // Filter by current user email
      const myIssues = user?.email
        ? list.filter((i) => i.assignee_email === user.email)
        : list;
      setTasks(myIssues.map(mapIssue));
    } catch { /* empty */ }
  }, [groupId, user?.email]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Update task status
  const handleStatusChange = async (issueId, newStatus) => {
    if (!groupId) return;
    try {
      await updateIssueStatusApi(groupId, issueId, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công!');
      fetchTasks();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  // Sync from Jira
  const [syncing, setSyncing] = useState(false);
  const handleSync = async () => {
    if (!groupId) return;
    setSyncing(true);
    try {
      await syncJiraIssuesApi(groupId);
      toast.success('Đồng bộ Jira thành công!');
      fetchTasks();
    } catch {
      toast.error('Đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = [
    {
      title: 'Total Tasks',
      value: tasks.length,
      icon: ListTodo,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtext: 'Assigned to you',
      trend: '+2.4%',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'In Progress',
      value: tasks.filter((t) => t.status === 'in_progress').length,
      icon: Clock,
      color: 'text-[var(--warning)]',
      bgColor: 'bg-[var(--warning)]/10',
      subtext: 'Actively working',
      trend: '+12.5%',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Completed',
      value: tasks.filter((t) => t.status === 'done').length,
      icon: CheckCircle2,
      color: 'text-[var(--success)]',
      bgColor: 'bg-[var(--success)]/10',
      subtext: 'This sprint',
      trend: '+5.7%',
      trendColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Overdue',
      value: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
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
