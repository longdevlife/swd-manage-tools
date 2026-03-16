import { useState } from 'react';
import { Layers, Shield, Users } from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { Separator } from '@/components/ui/separator';
import { AdminGroupsTab, AdminUsersTab } from '@/features/admin';

const tabs = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'groups', label: 'Groups', icon: Layers },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Manage users, groups, roles, and integration settings at the system level."
        actions={
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield size={20} />
          </div>
        }
      />

      <Separator />

      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'groups' && <AdminGroupsTab />}
      </div>
    </div>
  );
}
