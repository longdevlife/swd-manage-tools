import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    GitCommitHorizontal,
    Users,
    TrendingUp,
    Download,
    Calendar,
    CheckCircle2,
    BarChart3,
    RefreshCw,
    GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';

import { selectCurrentUser } from '@/stores/authSlice';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

import { getReportsApi, generateReportApi } from '@/features/reports/api/reportsApi';
import { getJiraIssuesApi } from '@/features/jira/api/jiraApi';
import { getCommitsApi } from '@/features/github/api/githubApi';
import { manualSyncApi } from '@/features/sync/api/syncApi';

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
                    className={`h-full rounded-full transition-all ${colorClass}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className="w-10 text-right text-xs font-medium">{percentage}%</span>
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
    const user = useSelector(selectCurrentUser);
    const activeGroupId = useSelector((state) => state.ui?.activeGroupId);
    const groupId = activeGroupId || user?.groups?.[0]?.group_id;

    const [reports, setReports] = useState([]);
    const [summary, setSummary] = useState({ total_group_commits: 0, total_group_lines: 0, total_group_issues_resolved: 0 });
    const [jiraStats, setJiraStats] = useState({ total: 0, done: 0 });
    const [loading, setLoading] = useState(false);
    const [commits, setCommits] = useState([]);
    const [commitsLoading, setCommitsLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Fetch contribution reports + jira stats
    const fetchData = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            // Fetch contribution reports
            const reportsRes = await getReportsApi(groupId).catch(() => null);
            const reportsData = reportsRes?.data?.data || reportsRes?.data || [];
            const summaryData = reportsRes?.data?.summary || {};
            if (Array.isArray(reportsData)) setReports(reportsData);
            setSummary({
                total_group_commits: summaryData.total_group_commits || 0,
                total_group_lines: summaryData.total_group_lines || 0,
                total_group_issues_resolved: summaryData.total_group_issues_resolved || 0,
            });

            // Fetch Jira issues for task stats
            const issuesRes = await getJiraIssuesApi(groupId).catch(() => null);
            const issues = issuesRes?.data?.data || issuesRes?.data || [];
            if (Array.isArray(issues)) {
                const done = issues.filter((i) => ['Done', 'Closed', 'Resolved'].includes(i.status)).length;
                setJiraStats({ total: issues.length, done });
            }
        } catch { /* empty */ }
        setLoading(false);
    }, [groupId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Fetch commits
    const fetchCommits = useCallback(async () => {
        if (!groupId) return;
        setCommitsLoading(true);
        try {
            const res = await getCommitsApi(groupId);
            const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
            setCommits(Array.isArray(list) ? list.slice(0, 50) : []);
        } catch { /* empty */ }
        setCommitsLoading(false);
    }, [groupId]);

    useEffect(() => { fetchCommits(); }, [fetchCommits]);

    // Manual Sync (Jira + GitHub)
    const handleSync = async () => {
        if (!groupId) { toast.warning('Bạn chưa thuộc nhóm nào. Liên hệ Admin để được thêm vào nhóm.'); return; }
        setSyncing(true);
        try {
            await manualSyncApi(groupId);
            toast.success('Đồng bộ thành công!');
            fetchData();
            fetchCommits();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Đồng bộ thất bại');
        } finally {
            setSyncing(false);
        }
    };

    // Generate report action
    const handleGenerateReport = async () => {
        if (!groupId) { toast.warning('Bạn chưa thuộc nhóm nào.'); return; }
        try {
            toast.info('Đang tạo báo cáo...');
            await generateReportApi(groupId);
            toast.success('Báo cáo đã được tạo thành công!');
            fetchData();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể tạo báo cáo');
        }
    };

    // Computed stats
    const totalMembers = reports.length;
    const totalCommits = summary.total_group_commits;
    const totalIssues = jiraStats.total;
    const completedIssues = jiraStats.done;
    const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

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
            subtext: 'All time',
        },
        {
            title: 'Completion Rate',
            value: `${completionRate}%`,
            icon: TrendingUp,
            color: 'text-[var(--success)]',
            bgColor: 'bg-[var(--success)]/10',
            subtext: `${completedIssues}/${totalIssues} issues`,
        },
        {
            title: 'Issues Resolved',
            value: summary.total_group_issues_resolved,
            icon: BarChart3,
            color: 'text-[var(--warning)]',
            bgColor: 'bg-[var(--warning)]/10',
            subtext: 'Total resolved',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Reports & Analytics"
                description="Thống kê commit, tiến độ và báo cáo hiệu suất nhóm."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSync} disabled={syncing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            Sync
                        </Button>
                        <Button onClick={handleGenerateReport} disabled={loading || !groupId}>
                            <Download className="mr-2 h-4 w-4" />
                            Generate Report
                        </Button>
                    </div>
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

            {/* Contribution Summary Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div>
                        <CardTitle className="text-base">Team Contribution Summary</CardTitle>
                        <CardDescription className="mt-1">
                            Thống kê đóng góp của từng thành viên (commits, issues, lines of code)
                        </CardDescription>
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
                                <TableHead className="w-28 text-center">Issues Resolved</TableHead>
                                <TableHead className="w-28">Contribution %</TableHead>
                                <TableHead className="w-28">Calculated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                        {loading ? 'Đang tải...' : 'Chưa có báo cáo. Bấm "Generate Report" để tạo.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((r) => {
                                    const memberName = r.user?.full_name || r.user?.username || 'Unknown';
                                    const email = r.user?.email || '';
                                    const commitPct = r.contribution_percentage?.commits || 0;
                                    return (
                                        <TableRow key={r.report_id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <AvatarCircle name={memberName} />
                                                    <div>
                                                        <p className="text-sm font-medium">{memberName}</p>
                                                        <p className="text-xs text-muted-foreground">{email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <GitCommitHorizontal size={14} className="text-muted-foreground" />
                                                    <span className="font-semibold">{r.total_commits}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2 text-xs">
                                                    <span className="font-mono text-[var(--success)]">
                                                        +{(r.total_lines_added || 0).toLocaleString()}
                                                    </span>
                                                    <span className="font-mono text-destructive">
                                                        −{(r.total_lines_deleted || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <CheckCircle2 size={13} className="text-[var(--success)]" />
                                                    <span className="text-sm font-semibold">{r.total_issues_resolved}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <ProgressBar
                                                    percentage={commitPct}
                                                    colorClass={commitPct >= 30 ? 'bg-[var(--success)]' : commitPct >= 15 ? 'bg-[var(--warning)]' : 'bg-destructive'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(r.calculated_at)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
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
                        {reports.map((r) => {
                            const memberName = r.user?.full_name || r.user?.username || 'Unknown';
                            const email = r.user?.email || '';
                            const commitPct = r.contribution_percentage?.commits || 0;
                            return (
                                <div
                                    key={r.report_id}
                                    className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <AvatarCircle name={memberName} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{memberName}</p>
                                            <p className="text-xs text-muted-foreground">{email}</p>
                                        </div>
                                    </div>
                                    <Separator className="my-3" />
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-primary">{r.total_commits}</p>
                                            <p className="text-[10px] text-muted-foreground">Commits</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">{r.total_issues_resolved}</p>
                                            <p className="text-[10px] text-muted-foreground">Issues Done</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">{commitPct}%</p>
                                            <p className="text-[10px] text-muted-foreground">Contribution</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <ProgressBar
                                            percentage={commitPct}
                                            colorClass={
                                                commitPct >= 30
                                                    ? 'bg-[var(--success)]'
                                                    : commitPct >= 15
                                                        ? 'bg-[var(--warning)]'
                                                        : 'bg-destructive'
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {reports.length === 0 && !loading && (
                            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                                Chưa có dữ liệu. Bấm &quot;Generate Report&quot; để tạo báo cáo.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* GitHub Commits Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <GitBranch className="h-4 w-4" />
                                Recent GitHub Commits
                            </CardTitle>
                            <CardDescription className="mt-1">Lịch sử commit của team từ GitHub</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchCommits} disabled={commitsLoading}>
                            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${commitsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Author</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead className="w-24">SHA</TableHead>
                                <TableHead className="w-32">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                        {commitsLoading ? 'Đang tải...' : 'Chưa có commits. Hãy cấu hình GitHub và Sync.'}
                                    </TableCell>
                                </TableRow>
                            ) : commits.map((c, idx) => (
                                <TableRow key={c.commit_id || idx} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <AvatarCircle name={c.author_name || c.author || 'Unknown'} />
                                            <span className="text-sm font-medium">{c.author_name || c.author || '—'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[400px] truncate text-sm">
                                        {c.message || c.commit_message || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {(c.sha || c.commit_hash || '').substring(0, 7)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDate(c.committed_at || c.commit_date || c.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
