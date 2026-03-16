export const ROLE_BADGE_VARIANT = {
  ROLE_ADMIN: 'destructive',
  ROLE_LECTURER: 'secondary',
  ROLE_LEADER: 'default',
  ROLE_MEMBER: 'outline',
};

export const ROLE_LABEL = {
  ROLE_ADMIN: 'Admin',
  ROLE_LECTURER: 'Lecturer',
  ROLE_LEADER: 'Leader',
  ROLE_MEMBER: 'Member',
};

export function normalizeRole(role) {
  if (!role) return 'ROLE_MEMBER';
  return role.startsWith('ROLE_') ? role : `ROLE_${role}`;
}

export function denormalizeRole(role) {
  return normalizeRole(role).replace(/^ROLE_/i, '');
}

export function normalizeUser(user) {
  const primaryRole = normalizeRole(user?.role ?? user?.roles?.[0]);
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((role) => normalizeRole(role))
    : [primaryRole];

  return {
    userId: user?.user_id ?? user?.userId,
    username:
      user?.full_name ?? user?.username ?? user?.name ?? user?.email ?? `User #${user?.user_id}`,
    email: user?.email ?? '',
    role: primaryRole,
    roles,
    githubUsername: user?.github_username ?? user?.githubUsername ?? '',
    phoneNumber: user?.phone_number ?? user?.phoneNumber ?? '',
    yob: user?.yob ?? '',
    isActive: user?.is_active ?? user?.isActive ?? true,
    groups: Array.isArray(user?.group_memberships)
      ? user.group_memberships.map((membership) => ({
          groupId: membership?.group?.group_id,
          groupName: membership?.group?.group_name,
        }))
      : Array.isArray(user?.groups)
        ? user.groups.map((group) => ({
            groupId: group?.group_id ?? group?.groupId,
            groupName: group?.group_name ?? group?.groupName,
          }))
        : [],
  };
}

function normalizeMember(member, leaderId) {
  const normalizedUserId = member?.user?.user_id ?? member?.user_id;

  return {
    userId: normalizedUserId,
    username: member?.user?.full_name ?? member?.user?.email ?? `User #${normalizedUserId}`,
    email: member?.user?.email ?? '',
    role: normalizedUserId === leaderId ? 'ROLE_LEADER' : 'ROLE_MEMBER',
  };
}

export function normalizeGroup(group) {
  const leaderRecord = group?.group_leaders?.[0] ?? null;
  const leaderId = leaderRecord?.user?.user_id ?? leaderRecord?.user_id ?? null;

  return {
    groupId: group?.group_id ?? group?.groupId,
    groupName: group?.group_name ?? group?.groupName ?? 'Unnamed group',
    semester: group?.semester ?? '',
    projectTitle: group?.project_title ?? group?.projectTitle ?? '',
    projectKey: group?.jira_project?.project_key ?? group?.jira_config?.project_key ?? null,
    createdAt: group?.created_at ?? null,
    members: Array.isArray(group?.group_members)
      ? group.group_members.map((member) => normalizeMember(member, leaderId))
      : Array.isArray(group?.members)
        ? group.members.map((member) => ({
            ...member,
            role: normalizeRole(member?.role),
          }))
        : [],
    teamLeader: leaderRecord
      ? {
          userId: leaderId,
          username: leaderRecord?.user?.full_name ?? `User #${leaderId}`,
          email: leaderRecord?.user?.email ?? '',
        }
      : null,
    lecturer: group?.lecturer_assignments?.[0]
      ? {
          userId:
            group.lecturer_assignments[0]?.user?.user_id ??
            group.lecturer_assignments[0]?.lecturer_id,
          username:
            group.lecturer_assignments[0]?.user?.full_name ??
            group.lecturer_assignments[0]?.user?.email ??
            `Lecturer #${group.lecturer_assignments[0]?.lecturer_id}`,
          email: group.lecturer_assignments[0]?.user?.email ?? '',
        }
      : null,
  };
}
