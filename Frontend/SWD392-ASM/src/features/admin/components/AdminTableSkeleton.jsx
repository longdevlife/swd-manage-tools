import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

export function AdminTableSkeleton({ cols = 5, rows = 5 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <TableRow key={`skeleton-row-${rowIndex}`}>
      {Array.from({ length: cols }).map((__, colIndex) => (
        <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}
