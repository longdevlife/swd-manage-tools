import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { selectCurrentUser } from '@/stores/authSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getJiraIssuesApi, syncJiraIssuesApi } from '@/features/jira/api/jiraApi';

const STATUS_MAP = {
  'To Do': 'todo',
  'In Progress': 'in_progress',
  'In Review': 'in_review',
  Done: 'done',
  Closed: 'done',
  Resolved: 'done',
};

const statusConfig = {
  todo: { label: 'To Do', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  in_review: { label: 'In Review', variant: 'outline' },
  done: { label: 'Done', variant: 'secondary' },
};

export function TasksPage() {
  const user = useSelector(selectCurrentUser);
  const activeGroupId = useSelector((state) => state.ui?.activeGroupId);
  const groupId = activeGroupId || user?.groups?.[0]?.group_id;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!groupId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getJiraIssuesApi(groupId);
      const issues = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setTasks(
        issues.map((i) => ({
          id: i.issue_key || i.id,
          title: i.summary || i.title || '',
          status: STATUS_MAP[i.status] || 'todo',
          priority: (i.priority || '').toLowerCase(),
        })),
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được Jira issues');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const handleSync = async () => {
    if (!groupId) {
      toast.warning('Bạn chưa thuộc nhóm nào.');
      return;
    }

    setSyncing(true);
    try {
      await syncJiraIssuesApi(groupId);
      toast.success('Đồng bộ Jira thành công');
      await fetchTasks();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đồng bộ Jira thất bại');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Team task management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Jira
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>
      </div>

      {/* Task Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">
            Loading tasks...
          </p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">
            No tasks found. Try syncing Jira first.
          </p>
        ) : (
          tasks.map((task) => {
            const status = statusConfig[task.status] || statusConfig.todo;
            return (
              <Card
                key={task.id}
                className="cursor-pointer shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
