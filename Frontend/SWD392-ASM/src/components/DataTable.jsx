// components/DataTable.jsx
// Reusable table component với loading, empty state, và pagination
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';

export function DataTable({
  columns, // [{ key, label, render?, className? }]
  data = [],
  isLoading = false,
  emptyIcon,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyAction,
  className,
  onRowClick,
  ...props
}) {
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Đang tải dữ liệu..." />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn('rounded-md border', className)} {...props}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow
              key={row.id || row.key || idx}
              className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
