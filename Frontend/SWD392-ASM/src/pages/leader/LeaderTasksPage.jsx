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
    Filter,
    CircleDot,
    Timer,
    CircleCheck,
    CirclePause,
    Plus,
    UserPlus,
    MoreHorizontal,
    Pencil,
    Trash2,
    RefreshCw,
} from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { getJiraIssuesApi, assignIssueApi, syncJiraIssuesApi, updateIssueStatusApi } from '@/features/jira/api/jiraApi';
import { getMembersApi } from '@/features/groups/api/groupsApi';

// ─── Data Mapping ─────────────────────────────────────────────────────────────
// Map backend Jira status → UI status key
const STATUS_MAP = {
    'To Do': 'todo',
    'In Progress': 'in_progress',
    'In Review': 'in_review',
    'Done': 'done',
    'Closed': 'done',
    'Resolved': 'done',
};
// Map backend priority → UI priority key
const PRIORITY_MAP = {
    Highest: 'urgent',
    High: 'high',
    Medium: 'medium',
    Low: 'low',
    Lowest: 'low',
};

// Chuyển đổi Jira Issue từ API → format mà UI đang dùng
const mapIssue = (issue, members = []) => {
    const assignee = members.find(
        (m) => m.email === issue.assignee_email
    ) || (issue.assignee_email ? { id: null, name: issue.assignee_email, email: issue.assignee_email, avatar: '?' } : null);
    return {
        id: issue.issue_key,
        title: issue.summary,
        description: issue.issue_type || '',
        sprint: '',
        priority: PRIORITY_MAP[issue.priority] || 'medium',
        status: STATUS_MAP[issue.status] || 'todo',
        dueDate: '',
        assignee,
        storyPoints: 0,
        labels: issue.issue_type ? [issue.issue_type] : [],
        createdDate: issue.created_at,
        comments: [],
        _raw: issue, // giữ raw data nếu cần
    };
};

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

function AvatarCircle({ name, size = 'sm' }) {
    const initials = name
        ? name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : '?';
    const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
    return (
        <div
            className={`${sizeClass} flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary`}
        >
            {initials}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeaderTasksPage() {
    const user = useSelector(selectCurrentUser);
    const activeGroupId = useSelector((state) => state.ui?.activeGroupId);

    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        sprint: '',
        dueDate: '',
        assigneeId: '',
        storyPoints: 1,
    });

    // Lấy groupId từ Redux hoặc user's groups
    const groupId = activeGroupId || user?.groups?.[0]?.group_id;

    // Fetch data từ API
    const fetchData = useCallback(async () => {
        if (!groupId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [issuesRes, membersRes] = await Promise.all([
                getJiraIssuesApi(groupId).catch(() => ({ data: [] })),
                getMembersApi(groupId).catch(() => ({ data: [] })),
            ]);
            const membersList = Array.isArray(membersRes?.data) ? membersRes.data : (Array.isArray(membersRes) ? membersRes : []);
            const issuesList = Array.isArray(issuesRes?.data) ? issuesRes.data : (Array.isArray(issuesRes) ? issuesRes : []);
            setMembers(membersList.map((m) => ({
                id: m.user_id || m.id,
                name: m.full_name || m.name || m.email,
                email: m.email,
                avatar: (m.full_name || m.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
            })));
            setTasks(issuesList.map((issue) => mapIssue(issue, membersList)));
        } catch {
            toast.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Sync Jira issues
    const handleSyncJira = async () => {
        if (!groupId) {
            toast.warning('Bạn chưa thuộc nhóm nào. Liên hệ Admin để được thêm vào nhóm.');
            return;
        }
        setSyncing(true);
        try {
            await syncJiraIssuesApi(groupId);
            toast.success('Đồng bộ Jira thành công!');
            fetchData();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Đồng bộ Jira thất bại. Kiểm tra lại Jira Config.');
        } finally {
            setSyncing(false);
        }
    };

    // Update issue status
    const handleStatusChange = async (issueId, newStatus) => {
        if (!groupId) { toast.warning('Bạn chưa thuộc nhóm nào.'); return; }
        try {
            await updateIssueStatusApi(groupId, issueId, { status: newStatus });
            toast.success('Cập nhật trạng thái thành công!');
            fetchData();
        } catch {
            toast.error('Cập nhật trạng thái thất bại');
        }
    };

    // Filter logic
    const filteredTasks = tasks.filter((task) => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (assigneeFilter !== 'all') {
            if (assigneeFilter === 'unassigned' && task.assignee) return false;
            if (assigneeFilter !== 'unassigned' && task.assignee?.id !== assigneeFilter) return false;
        }
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
            subtext: `${tasks.filter((t) => !t.assignee).length} unassigned`,
        },
        {
            title: 'In Progress',
            value: tasks.filter((t) => t.status === 'in_progress').length,
            icon: Clock,
            color: 'text-[var(--warning)]',
            bgColor: 'bg-[var(--warning)]/10',
            subtext: 'Actively working',
        },
        {
            title: 'Completed',
            value: tasks.filter((t) => t.status === 'done').length,
            icon: CheckCircle2,
            color: 'text-[var(--success)]',
            bgColor: 'bg-[var(--success)]/10',
            subtext: `${Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)}% completion`,
        },
        {
            title: 'Overdue',
            value: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
            icon: AlertCircle,
            color: 'text-destructive',
            bgColor: 'bg-destructive/10',
            subtext: 'Needs attention',
        },
    ];

    // Assign handler — gọi API thực để sync lên Jira
    const [assigning, setAssigning] = useState(false);
    const handleAssign = async (memberId) => {
        if (!assignTarget || !groupId) return;
        const member = members.find((m) => m.id === memberId);
        setAssigning(true);
        try {
            await assignIssueApi(groupId, assignTarget.id, { assignee_id: memberId });
            setTasks((prev) =>
                prev.map((t) => (t.id === assignTarget.id ? { ...t, assignee: member } : t)),
            );
            toast.success(`Đã giao task ${assignTarget.id} cho ${member.name}`);
            setAssignDialogOpen(false);
            setAssignTarget(null);
        } catch (err) {
            toast.error(err?.response?.data?.message ?? 'Giao task thất bại');
        } finally {
            setAssigning(false);
        }
    };

    // Create task handler
    const handleCreateTask = () => {
        if (!newTask.title.trim()) {
            toast.error('Vui lòng nhập tên task');
            return;
        }
        const member = members.find((m) => m.id === newTask.assigneeId) || null;
        const task = {
            id: `SWD-${100 + tasks.length + 1}`,
            title: newTask.title,
            description: newTask.description,
            sprint: newTask.sprint,
            priority: newTask.priority,
            status: newTask.status,
            dueDate: newTask.dueDate,
            assignee: member,
            storyPoints: Number(newTask.storyPoints) || 1,
            labels: [],
            createdDate: new Date().toISOString().split('T')[0],
            comments: [],
        };
        setTasks((prev) => [task, ...prev]);
        toast.success(`Đã tạo task ${task.id}: ${task.title}`);
        setCreateDialogOpen(false);
        setNewTask({
            title: '',
            description: '',
            priority: 'medium',
            status: 'todo',
            sprint: 'Sprint 3',
            dueDate: '',
            assigneeId: '',
            storyPoints: 1,
        });
    };

    // Delete handler
    const handleDelete = (taskId) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success(`Đã xóa task ${taskId}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Task Management"
                description="Quản lý và phân công task cho các thành viên trong nhóm."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSyncJira} disabled={syncing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            Sync Jira
                        </Button>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Task
                        </Button>
                    </div>
                }
            />

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
                                    <div className="mt-1.5">
                                        <span className="text-xs text-muted-foreground">{stat.subtext}</span>
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
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Members</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {members.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
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
                            All Tasks
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
                                <TableHead className="w-36">Assignee</TableHead>
                                <TableHead className="w-28">Sprint</TableHead>
                                <TableHead className="w-24">Priority</TableHead>
                                <TableHead className="w-32">Status</TableHead>
                                <TableHead className="w-28">Due Date</TableHead>
                                <TableHead className="w-16 text-center">SP</TableHead>
                                <TableHead className="w-20 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
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
                                            {task.assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <AvatarCircle name={task.assignee.name} />
                                                    <span className="text-sm">{task.assignee.name}</span>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 gap-1 text-xs text-muted-foreground"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAssignTarget(task);
                                                        setAssignDialogOpen(true);
                                                    }}
                                                >
                                                    <UserPlus size={14} />
                                                    Assign
                                                </Button>
                                            )}
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
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTask(task);
                                                        }}
                                                    >
                                                        <Eye size={14} className="mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssignTarget(task);
                                                            setAssignDialogOpen(true);
                                                        }}
                                                    >
                                                        <UserPlus size={14} className="mr-2" />
                                                        Assign
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(task.id);
                                                        }}
                                                    >
                                                        <Trash2 size={14} className="mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ═══ Task Detail Dialog ═══ */}
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

                            {/* Assignee */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold">Assignee:</span>
                                {selectedTask.assignee ? (
                                    <div className="flex items-center gap-2">
                                        <AvatarCircle name={selectedTask.assignee.name} />
                                        <div>
                                            <p className="text-sm font-medium">{selectedTask.assignee.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedTask.assignee.email}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => {
                                            setAssignTarget(selectedTask);
                                            setAssignDialogOpen(true);
                                        }}
                                    >
                                        <UserPlus size={14} />
                                        Assign Member
                                    </Button>
                                )}
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
                            {selectedTask.labels.length > 0 && (
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
                            )}

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
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ Assign Dialog ═══ */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Task</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Chọn thành viên để giao task{' '}
                        <span className="font-mono font-semibold text-primary">{assignTarget?.id}</span>
                    </p>
                    <div className="space-y-2 pt-2">
                        {members.map((member) => (
                            <button
                                key={member.id}
                                className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50"
                                onClick={() => handleAssign(member.id)}
                            >
                                <AvatarCircle name={member.name} size="md" />
                                <div>
                                    <p className="text-sm font-medium">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                                {assignTarget?.assignee?.id === member.id && (
                                    <Badge variant="secondary" className="ml-auto text-[10px]">
                                        Current
                                    </Badge>
                                )}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ Create Task Dialog ═══ */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="task-title">Title *</Label>
                            <Input
                                id="task-title"
                                placeholder="Enter task title..."
                                value={newTask.title}
                                onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-desc">Description</Label>
                            <Textarea
                                id="task-desc"
                                placeholder="Describe the task..."
                                rows={3}
                                value={newTask.description}
                                onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={newTask.priority}
                                    onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sprint</Label>
                                <Select
                                    value={newTask.sprint}
                                    onValueChange={(v) => setNewTask((p) => ({ ...p, sprint: v }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sprint 1">Sprint 1</SelectItem>
                                        <SelectItem value="Sprint 2">Sprint 2</SelectItem>
                                        <SelectItem value="Sprint 3">Sprint 3</SelectItem>
                                        <SelectItem value="Sprint 4">Sprint 4</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Assignee</Label>
                                <Select
                                    value={newTask.assigneeId}
                                    onValueChange={(v) => setNewTask((p) => ({ ...p, assigneeId: v }))}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {members.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="task-due">Due Date</Label>
                                <Input
                                    id="task-due"
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-sp">Story Points</Label>
                            <Input
                                id="task-sp"
                                type="number"
                                min={1}
                                max={13}
                                value={newTask.storyPoints}
                                onChange={(e) => setNewTask((p) => ({ ...p, storyPoints: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateTask}>Create Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
