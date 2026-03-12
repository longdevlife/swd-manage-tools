import { useState } from 'react';
import {
    GitCommitHorizontal,
    Users,
    TrendingUp,
    FileBarChart,
    Download,
    Calendar,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    BarChart3,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ─── Mock Data ────────────────────────────────────────────────────────────────

// mockTeamStats được tính tự động sau khi mockCommitSummary + getMemberStats được khai báo
// → Xem phần computedTeamStats bên trong component

const mockCommitSummary = [
    {
        id: 'm1',
        name: 'Nguyễn Văn A',
        email: 'a.nguyen@fpt.edu.vn',
        topRepo: 'swp391-frontend',
        sprints: {
            // Sprint 1: hoàn thành hết → 100% xanh lá
            sprint1: { commits: 10, additions: 800, deletions: 200, lastCommit: '2026-02-15', tasksCompleted: 3, totalTasks: 3 },
            // Sprint 2: hoàn thành phần lớn
            sprint2: { commits: 8, additions: 650, deletions: 300, lastCommit: '2026-02-28', tasksCompleted: 2, totalTasks: 2 },
            // Sprint 3: đang làm
            sprint3: { commits: 14, additions: 1000, deletions: 390, lastCommit: '2026-03-11', tasksCompleted: 1, totalTasks: 3 },
        },
    },
    {
        id: 'm2',
        name: 'Trần Thị B',
        email: 'b.tran@fpt.edu.vn',
        topRepo: 'swp391-backend',
        sprints: {
            sprint1: { commits: 8, additions: 500, deletions: 150, lastCommit: '2026-02-14', tasksCompleted: 2, totalTasks: 2 },
            sprint2: { commits: 12, additions: 700, deletions: 210, lastCommit: '2026-02-27', tasksCompleted: 2, totalTasks: 3 },
            sprint3: { commits: 8, additions: 600, deletions: 200, lastCommit: '2026-03-10', tasksCompleted: 0, totalTasks: 2 },
        },
    },
    {
        id: 'm3',
        name: 'Lê Văn C',
        email: 'c.le@fpt.edu.vn',
        topRepo: 'swp391-frontend',
        sprints: {
            sprint1: { commits: 5, additions: 300, deletions: 80, lastCommit: '2026-02-13', tasksCompleted: 2, totalTasks: 2 },
            sprint2: { commits: 6, additions: 400, deletions: 120, lastCommit: '2026-02-26', tasksCompleted: 1, totalTasks: 2 },
            sprint3: { commits: 7, additions: 500, deletions: 120, lastCommit: '2026-03-11', tasksCompleted: 0, totalTasks: 3 },
        },
    },
    {
        id: 'm4',
        name: 'Phạm Thị D',
        email: 'd.pham@fpt.edu.vn',
        topRepo: 'swp391-backend',
        sprints: {
            sprint1: { commits: 3, additions: 180, deletions: 40, lastCommit: '2026-02-12', tasksCompleted: 1, totalTasks: 1 },
            sprint2: { commits: 4, additions: 250, deletions: 60, lastCommit: '2026-02-25', tasksCompleted: 1, totalTasks: 1 },
            sprint3: { commits: 2, additions: 250, deletions: 50, lastCommit: '2026-03-09', tasksCompleted: 2, totalTasks: 2 },
        },
    },
];

// Helper: tổng hợp data theo sprint filter
function getMemberStats(member, sprintFilter) {
    if (sprintFilter === 'all') {
        const all = Object.values(member.sprints);
        return {
            commits: all.reduce((s, d) => s + d.commits, 0),
            additions: all.reduce((s, d) => s + d.additions, 0),
            deletions: all.reduce((s, d) => s + d.deletions, 0),
            lastCommit: all.reduce((latest, d) => (d.lastCommit > latest ? d.lastCommit : latest), ''),
            tasksCompleted: all.reduce((s, d) => s + d.tasksCompleted, 0),
            totalTasks: all.reduce((s, d) => s + d.totalTasks, 0),
        };
    }
    const data = member.sprints[sprintFilter];
    return data || { commits: 0, additions: 0, deletions: 0, lastCommit: '', tasksCompleted: 0, totalTasks: 0 };
}

// Tự động tính Sprint Progress từ mockCommitSummary
const sprintKeys = [
    { key: 'sprint1', label: 'Sprint 1' },
    { key: 'sprint2', label: 'Sprint 2' },
    { key: 'sprint3', label: 'Sprint 3' },
];

const mockSprintProgress = sprintKeys.map(({ key, label }) => {
    const total = mockCommitSummary.reduce((s, m) => s + (m.sprints[key]?.totalTasks || 0), 0);
    const completed = mockCommitSummary.reduce((s, m) => s + (m.sprints[key]?.tasksCompleted || 0), 0);
    return {
        sprint: label,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ProgressBar({ percentage, colorClass = 'bg-primary' }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-sm font-semibold tabular-nums">{percentage}%</span>
        </div>
    );
}

function AvatarCircle({ name }) {
    const initials = name
        ? name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : '?';
    return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeaderReportsPage() {
    const [sprintFilter, setSprintFilter] = useState('all');

    const handleGenerateReport = () => {
        toast.success('Báo cáo đang được tạo...', {
            description: 'File PDF sẽ được tải xuống trong giây lát.',
        });
    };

    // Tính toán team stats từ mockCommitSummary — cùng nguồn data với bảng và performance cards
    const allMemberStats = mockCommitSummary.map((m) => getMemberStats(m, sprintFilter));
    const totalMembers = mockCommitSummary.length;
    const totalCommits = allMemberStats.reduce((s, d) => s + d.commits, 0);
    const totalTasks = allMemberStats.reduce((s, d) => s + d.totalTasks, 0);
    const completedTasks = allMemberStats.reduce((s, d) => s + d.tasksCompleted, 0);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const sprintLabel = sprintFilter === 'all' ? 'All Sprints' : sprintKeys.find((s) => s.key === sprintFilter)?.label || '';

    const overviewStats = [
        {
            title: 'Team Members',
            value: totalMembers,
            icon: Users,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
            subtext: 'Active members',
        },
        {
            title: 'Total Commits',
            value: totalCommits,
            icon: GitCommitHorizontal,
            color: 'text-[var(--info)]',
            bgColor: 'bg-[var(--info)]/10',
            subtext: sprintLabel,
        },
        {
            title: 'Completion Rate',
            value: `${completionRate}%`,
            icon: TrendingUp,
            color: 'text-[var(--success)]',
            bgColor: 'bg-[var(--success)]/10',
            subtext: `${completedTasks}/${totalTasks} tasks`,
        },
        {
            title: 'Story Points',
            value: totalTasks,
            icon: BarChart3,
            color: 'text-[var(--warning)]',
            bgColor: 'bg-[var(--warning)]/10',
            subtext: sprintLabel,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Reports & Analytics"
                description="Thống kê commit, tiến độ và báo cáo hiệu suất nhóm."
                actions={
                    <Button onClick={handleGenerateReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Generate Report
                    </Button>
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
                                    <div className="mt-1.5">
                                        <span className="text-xs text-muted-foreground">{stat.subtext}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Commit Summary Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Team Commit Summary</CardTitle>
                            <CardDescription className="mt-1">
                                Thống kê commit GitHub của từng thành viên
                            </CardDescription>
                        </div>
                        <Select value={sprintFilter} onValueChange={setSprintFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Sprint" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sprints</SelectItem>
                                <SelectItem value="sprint1">Sprint 1</SelectItem>
                                <SelectItem value="sprint2">Sprint 2</SelectItem>
                                <SelectItem value="sprint3">Sprint 3</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead className="w-24 text-center">Commits</TableHead>
                                <TableHead className="w-28 text-center">
                                    <span className="text-[var(--success)]">+</span> /{' '}
                                    <span className="text-destructive">−</span>
                                </TableHead>
                                <TableHead className="w-32">Top Repo</TableHead>
                                <TableHead className="w-28">Task Progress</TableHead>
                                <TableHead className="w-28">Last Commit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockCommitSummary.map((member) => {
                                const stats = getMemberStats(member, sprintFilter);
                                return (
                                    <TableRow key={member.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <AvatarCircle name={member.name} />
                                                <div>
                                                    <p className="text-sm font-medium">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <GitCommitHorizontal size={14} className="text-muted-foreground" />
                                                <span className="font-semibold">{stats.commits}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-xs">
                                                <span className="font-mono text-[var(--success)]">
                                                    +{stats.additions.toLocaleString()}
                                                </span>
                                                <span className="font-mono text-destructive">
                                                    −{stats.deletions.toLocaleString()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {member.topRepo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 size={13} className="text-[var(--success)]" />
                                                <span className="text-sm">
                                                    {stats.tasksCompleted}/{stats.totalTasks}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(stats.lastCommit)}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Sprint Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Sprint Progress</CardTitle>
                    <CardDescription>Tiến độ hoàn thành theo từng sprint</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-5">
                        {mockSprintProgress.map((sprint) => (
                            <div key={sprint.sprint} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{sprint.sprint}</span>
                                        <Badge
                                            variant={sprint.percentage === 100 ? 'secondary' : 'outline'}
                                            className="text-[10px]"
                                        >
                                            {sprint.completed}/{sprint.total} tasks
                                        </Badge>
                                    </div>
                                    {sprint.percentage === 100 && (
                                        <Badge variant="secondary" className="gap-1 text-[10px]">
                                            <CheckCircle2 size={10} />
                                            Completed
                                        </Badge>
                                    )}
                                </div>
                                <ProgressBar
                                    percentage={sprint.percentage}
                                    colorClass={
                                        sprint.percentage === 100
                                            ? 'bg-[var(--success)]'
                                            : sprint.percentage >= 75
                                                ? 'bg-[var(--info)]'
                                                : sprint.percentage >= 50
                                                    ? 'bg-[var(--warning)]'
                                                    : 'bg-primary'
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Per-member Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Member Performance Overview</CardTitle>
                    <CardDescription>Đánh giá hiệu suất từng thành viên</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {mockCommitSummary.map((member) => {
                            const stats = getMemberStats(member, sprintFilter);
                            const taskRate =
                                stats.totalTasks > 0
                                    ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100)
                                    : 0;
                            return (
                                <div
                                    key={member.id}
                                    className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <AvatarCircle name={member.name} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{member.name}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <Separator className="my-3" />
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-primary">{stats.commits}</p>
                                            <p className="text-[10px] text-muted-foreground">Commits</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">
                                                {stats.tasksCompleted}/{stats.totalTasks}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">Tasks Done</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">{taskRate}%</p>
                                            <p className="text-[10px] text-muted-foreground">Completion</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <ProgressBar
                                            percentage={taskRate}
                                            colorClass={
                                                taskRate === 100
                                                    ? 'bg-[var(--success)]'
                                                    : taskRate >= 50
                                                        ? 'bg-[var(--warning)]'
                                                        : 'bg-destructive'
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
