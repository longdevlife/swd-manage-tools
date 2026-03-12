import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockTasks = [
  { id: 1, title: 'Design Dashboard UI', status: 'done', priority: 'high' },
  {
    id: 2,
    title: 'Integrate Login API',
    status: 'in_progress',
    priority: 'urgent',
  },
  {
    id: 3,
    title: 'Write unit tests for Auth module',
    status: 'todo',
    priority: 'medium',
  },
  {
    id: 4,
    title: 'Setup CI/CD pipeline',
    status: 'in_review',
    priority: 'low',
  },
];

const statusMap = {
  todo: { label: 'To Do', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  in_review: { label: 'In Review', variant: 'outline' },
  done: { label: 'Done', variant: 'secondary' },
};

export function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Team task management</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </div>

      {/* Task Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockTasks.map((task) => {
          const status = statusMap[task.status] || statusMap.todo;
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
        })}
      </div>
    </div>
  );
}
