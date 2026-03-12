import { CheckCircle2, Clock, ListTodo, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Tasks',
    value: '24',
    icon: ListTodo,
    color: 'text-primary',
  },
  {
    title: 'In Progress',
    value: '8',
    icon: Clock,
    color: 'text-[var(--warning)]',
  },
  {
    title: 'Completed',
    value: '12',
    icon: CheckCircle2,
    color: 'text-[var(--success)]',
  },
  {
    title: 'Members',
    value: '4',
    icon: Users,
    color: 'text-[var(--info)]',
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Task management system overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Task list will display here...</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Team Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Activity timeline will display here...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
