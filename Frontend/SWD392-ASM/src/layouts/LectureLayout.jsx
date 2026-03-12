import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, List, Calendar, Settings as SettingsIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const lectureNavItems = [
  { to: '/lecture/settings', icon: SettingsIcon, label: 'Settings' },
  { to: '/lecturer-console', icon: BookOpen, label: 'Lecturer Console' },
];

export function LectureLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Lecture Management</h1>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          
      
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1440px] px-6">
          <nav className="flex gap-1">
            {lectureNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
