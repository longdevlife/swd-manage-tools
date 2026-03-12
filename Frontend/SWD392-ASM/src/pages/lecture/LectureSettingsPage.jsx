import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function LectureSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure lecture system settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure general lecture system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="default-duration">Default Lecture Duration</Label>
              <Input
                id="default-duration"
                placeholder="e.g., 2 hours"
                defaultValue="2 hours"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max-students">Maximum Students per Lecture</Label>
              <Input
                id="max-students"
                type="number"
                placeholder="50"
                defaultValue="50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="email-notifications" defaultChecked />
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for new lectures
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="schedule-reminders" defaultChecked />
              <div className="space-y-0.5">
                <Label htmlFor="schedule-reminders" className="cursor-pointer">
                  Schedule Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminders for upcoming lectures
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
