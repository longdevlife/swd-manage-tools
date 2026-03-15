import { useState } from 'react';
import { Eye, RefreshCw, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { ROLE_LABEL, denormalizeRole, normalizeRole, normalizeUser } from '../utils/adminMappers';

import { AdminRoleBadge } from './AdminRoleBadge';
import { AdminTableSkeleton } from './AdminTableSkeleton';

import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateUser,
  useDeactivateUser,
  useRoles,
  useUpdateUserRoles,
  useUserDetail,
  useUsers,
} from '@/features/users';

const DEFAULT_CREATE_FORM = {
  fullName: '',
  email: '',
  password: '',
  role: 'ROLE_MEMBER',
};

export function AdminUsersTab() {
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('ROLE_MEMBER');
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);

  const usersQuery = useUsers(
    roleFilter === 'ALL' ? undefined : { role: denormalizeRole(roleFilter) },
  );
  const rolesQuery = useRoles();
  const createUserMutation = useCreateUser();
  const updateUserRolesMutation = useUpdateUserRoles();
  const deactivateUserMutation = useDeactivateUser();
  const userDetailQuery = useUserDetail(selectedUserId);

  const users = Array.isArray(usersQuery.data?.data) ? usersQuery.data.data.map(normalizeUser) : [];

  const roleOptions = Array.isArray(rolesQuery.data?.data)
    ? rolesQuery.data.data.map((role) => normalizeRole(role.role_name))
    : ['ROLE_ADMIN', 'ROLE_LECTURER', 'ROLE_LEADER', 'ROLE_MEMBER'];

  const selectedUser = userDetailQuery.data?.data ? normalizeUser(userDetailQuery.data.data) : null;

  const handleOpenManage = (user) => {
    setSelectedUserId(user.userId);
    setSelectedRole(user.role);
    setManageOpen(true);
  };

  const handleCreateUser = async () => {
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error('Please fill in full name, email, and password');
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        full_name: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role_name: denormalizeRole(createForm.role),
      });

      setCreateForm(DEFAULT_CREATE_FORM);
      setCreateOpen(false);
    } catch {
      // handled by mutation toast
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUserId) return;

    try {
      await updateUserRolesMutation.mutateAsync({
        userId: selectedUserId,
        roles: [denormalizeRole(selectedRole)],
      });
      await Promise.all([usersQuery.refetch(), userDetailQuery.refetch()]);
      setManageOpen(false);
      setSelectedUserId(null);
    } catch {
      // handled by mutation toast
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Deactivate account for "${selectedUser.username}"?`)) return;

    try {
      await deactivateUserMutation.mutateAsync(selectedUser.userId);
      await usersQuery.refetch();
      setManageOpen(false);
      setSelectedUserId(null);
    } catch {
      // handled by mutation toast
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Filter by Role:</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABEL[role] ?? role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isFetching}
          >
            <RefreshCw size={14} className={usersQuery.isFetching ? 'animate-spin' : ''} />
            <span className="ml-1">Refresh</span>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus size={14} />
            <span className="ml-1">Create User</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>GitHub</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading ? (
                <AdminTableSkeleton cols={7} rows={8} />
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={<ShieldCheck className="h-8 w-8" />}
                      title="No users found"
                      description="No users match the current filter."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.userId}
                    </TableCell>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <AdminRoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>{user.githubUsername || '—'}</TableCell>
                    <TableCell>
                      <span
                        className={user.isActive ? 'text-emerald-600' : 'text-muted-foreground'}
                      >
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Manage user"
                          onClick={() => handleOpenManage(user)}
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{users.length} users</p>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name</Label>
              <Input
                className="mt-1"
                value={createForm.fullName}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                placeholder="Nguyen Van A"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                className="mt-1"
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                className="mt-1"
                type="password"
                value={createForm.password}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABEL[role] ?? role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={manageOpen}
        onOpenChange={(open) => {
          setManageOpen(open);
          if (!open) {
            setSelectedUserId(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
          </DialogHeader>

          {userDetailQuery.isLoading ? (
            <div className="space-y-3 py-2">
              <div className="h-12 animate-pulse rounded-md bg-muted" />
              <div className="h-12 animate-pulse rounded-md bg-muted" />
              <div className="h-12 animate-pulse rounded-md bg-muted" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-4 py-2">
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">GitHub</p>
                  <p className="text-sm font-medium">{selectedUser.githubUsername || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">
                    {selectedUser.isActive ? 'Active' : 'Deactivated'}
                  </p>
                </div>
              </div>

              <div>
                <Label>Current Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABEL[role] ?? role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Current Groups</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.groups.length > 0 ? (
                    selectedUser.groups.map((group) => (
                      <span
                        key={`${selectedUser.userId}-${group.groupId}`}
                        className="rounded-full border px-2.5 py-1 text-xs"
                      >
                        {group.groupName}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Not in any group</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Failed to load user details"
              description="Try refreshing the list and opening this user again."
            />
          )}

          <DialogFooter className="justify-between sm:justify-between">
            <div>
              {selectedUser?.isActive && (
                <Button
                  variant="destructive"
                  onClick={handleDeactivate}
                  disabled={deactivateUserMutation.isPending}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Deactivate
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setManageOpen(false)}>
                Close
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={updateUserRolesMutation.isPending || !selectedUser}
              >
                {updateUserRolesMutation.isPending ? 'Saving...' : 'Update Role'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
