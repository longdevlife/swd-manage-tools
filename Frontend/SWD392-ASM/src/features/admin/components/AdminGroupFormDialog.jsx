import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminGroupFormDialog({
  open,
  title,
  form,
  onOpenChange,
  onFormChange,
  onSubmit,
  submitting,
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
              <Label>Group Name</Label>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
