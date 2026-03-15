import { AdminRoleBadge } from './AdminRoleBadge';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

export function AdminGroupFormDialog({
  open,
  title,
  form,
  availableMembers,
  availableLecturers,
  onOpenChange,
  onFormChange,
  onToggleMemberSelect,
  onSubmit,
  submitting,
  disableMemberSelection = false,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tên nhóm</Label>
              <Input
                className="mt-1"
                value={form.groupName}
                onChange={(event) =>
                  onFormChange((prev) => ({ ...prev, groupName: event.target.value }))
                }
                placeholder="Group 1A"
              />
            </div>
            <div>
              <Label>Semester</Label>
              <Input
                className="mt-1"
                value={form.semester}
                onChange={(event) =>
                  onFormChange((prev) => ({ ...prev, semester: event.target.value }))
                }
                placeholder="Spring 2026"
              />
            </div>
          </div>

          <div>
            <Label>Project Title</Label>
            <Input
              className="mt-1"
              value={form.projectTitle}
              onChange={(event) =>
                onFormChange((prev) => ({ ...prev, projectTitle: event.target.value }))
              }
              placeholder="Capstone Project"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Trưởng nhóm</Label>
              <Select
                value={form.leaderId}
                onValueChange={(value) => onFormChange((prev) => ({ ...prev, leaderId: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn leader" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.userId} value={String(member.userId)}>
                      {member.username} - {member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Giảng viên</Label>
              <Select
                value={form.lecturerId}
                onValueChange={(value) => onFormChange((prev) => ({ ...prev, lecturerId: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn giảng viên" />
                </SelectTrigger>
                <SelectContent>
                  {availableLecturers.map((lecturer) => (
                    <SelectItem key={lecturer.userId} value={String(lecturer.userId)}>
                      {lecturer.username} - {lecturer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!disableMemberSelection && (
            <div>
              <Label>Thành viên</Label>
              <div className="mt-1 max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                {availableMembers.map((member) => (
                  <label
                    key={member.userId}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={form.memberIds.includes(String(member.userId))}
                      onCheckedChange={() => onToggleMemberSelect(member.userId)}
                    />
                    <span>{member.username}</span>
                    <AdminRoleBadge role={member.role} />
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {form.memberIds.length} thành viên được chọn
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
