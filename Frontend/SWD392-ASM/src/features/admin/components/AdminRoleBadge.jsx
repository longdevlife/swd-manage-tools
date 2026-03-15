import { Badge } from '@/components/ui/badge';

import { ROLE_BADGE_VARIANT, ROLE_LABEL, normalizeRole } from '../utils/adminMappers';

export function AdminRoleBadge({ role }) {
  const normalizedRole = normalizeRole(role);

  return (
    <Badge variant={ROLE_BADGE_VARIANT[normalizedRole] ?? 'outline'} className="text-xs">
      {ROLE_LABEL[normalizedRole] ?? normalizedRole}
    </Badge>
  );
}
