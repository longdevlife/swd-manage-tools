import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { selectCurrentUser } from '@/stores/authSlice';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const user = useSelector(selectCurrentUser);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Content wrapper — large horizontal padding like Vuexy */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-6">
          {/* TopNav floating card */}
          <div className="rounded-xl bg-card shadow-[0_2px_9px_0_rgba(0,0,0,0.08)]">
            <TopNav user={user} />
          </div>

          {/* Page Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
