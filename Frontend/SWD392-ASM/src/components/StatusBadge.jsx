// components/StatusBadge.jsx
// Badge hiển thị trạng thái Jira issue với màu tương ứng
import { Badge } from '@/components/ui/badge';
import { JIRA_STATUS_COLORS, PRIORITY_COLORS } from '@/config/constants';

export function StatusBadge({ status, type = 'status', className, ...props }) {
  const colorMap = type === 'priority' ? PRIORITY_COLORS : JIRA_STATUS_COLORS;
  const variant = colorMap[status] || 'secondary';

  return (
    <Badge variant={variant} className={className} {...props}>
      {status}
    </Badge>
  );
}
