// components/StatCard.jsx
// Card hiển thị thống kê (commits, issues, lines...)
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({ icon, label, value, description, className, ...props }) {
  return (
    <Card className={cn('relative overflow-hidden', className)} {...props}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value ?? '—'}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
