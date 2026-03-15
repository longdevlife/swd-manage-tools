import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Circle,
  ClipboardList,
  FileText,
  Github,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  ListTodo,
  Mail,
  Settings,
  User,
  Users,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { selectUserRole } from '@/stores/authSlice';

const mainNavSections = [
  {
    title: 'APPS & PAGES',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/tasks', icon: ListTodo, label: 'Tasks' },
      {
        to: '', // Base path for active matching
        icon: Users,
        label: 'Members',
        subItems: [
          { to: '/my-tasks', label: 'My Tasks' },
          { to: '/my-stats', label: 'My Statistics' },
        ],
      },
      { to: '/messages', icon: Mail, label: 'Messages' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/documents', icon: FileText, label: 'Documents' },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { to: '/profile', icon: User, label: 'My Profile' },
      { to: '/help', icon: HelpCircle, label: 'Help' },
    ],
  },
];

const lectureNavSections = [
  {
    title: 'LECTURE MANAGEMENT',
    items: [
      { to: '/lecture', icon: GraduationCap, label: 'Lecturer Console', end: true },
      { to: '/lecture/github', icon: Github, label: 'GitHub Connector' },
      { to: '/lecture/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const leaderNavSections = [
  {
    title: 'LEADER MANAGEMENT',
    items: [
      { to: '/leader/tasks', icon: ClipboardList, label: 'Task Management' },
      { to: '/leader/reports', icon: BarChart3, label: 'Reports' },
      { to: '/lecture/settings', icon: Settings, label: 'Config Jira/GitHub' },
    ],
  },
];

function NavItem({ item, isExpanded }) {
  const location = useLocation();
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);

  // Auto-expand if current route matches any child
  const isChildActive = hasSubItems && item.subItems.some((sub) => location.pathname === sub.to);
  const [isOpen, setIsOpen] = useState(isChildActive);

  if (!hasSubItems) {
    return (
      <NavLink
        to={item.to}
        end={item.end}
        title={item.label}
        className={({ isActive }) =>
          cn(
            'flex items-center overflow-hidden rounded-md text-sm font-medium transition-colors',
            isExpanded ? 'gap-3 px-3 py-2' : 'justify-center py-2.5',
            isActive
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )
        }
      >
        <item.icon size={20} className="shrink-0" />
        {isExpanded && <span>{item.label}</span>}
      </NavLink>
    );
  }

  // Parent with Sub items
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={item.label}
        className={cn(
          'flex items-center w-full overflow-hidden rounded-md text-sm font-medium transition-colors',
          isExpanded ? 'gap-3 px-3 py-2 justify-between' : 'justify-center py-2.5',
          isChildActive
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon size={20} className="shrink-0" />
          {isExpanded && <span>{item.label}</span>}
        </div>
        {isExpanded && (
          <div className="shrink-0 text-muted-foreground/70">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </button>

      {/* Sub Items */}
      {isOpen && isExpanded && (
        <div className="flex flex-col gap-1 mt-1 pl-8">
          {item.subItems.map((subItem) => (
            <NavLink
              key={subItem.to}
              to={subItem.to}
              end={subItem.end}
              title={subItem.label}
              className={({ isActive }) =>
                cn(
                  'flex items-center overflow-hidden rounded-md text-sm font-medium transition-colors px-3 py-2',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <div className="w-1.5 h-1.5 rounded-full border border-current mr-3 shrink-0 opacity-50" />
              <span>{subItem.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggleCollapse }) {
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const userRole = useSelector(selectUserRole);

  const isExpanded = !collapsed || hovered;
  const isLectureRoute = location.pathname.startsWith('/lecture');
  const isLeaderRoute = location.pathname.startsWith('/leader');

  const baseNavSections = isLectureRoute
    ? lectureNavSections
    : isLeaderRoute
      ? leaderNavSections
      : mainNavSections;

  // Normalize role: strip ROLE_ prefix for comparison
  const normalizedRole = (userRole || '').replace(/^ROLE_/i, '');

  // Append role-specific sections
  const roleSections = [];

  // Leader section for LEADER/ADMIN
  if (['LEADER', 'ADMIN'].includes(normalizedRole) && !isLeaderRoute && !isLectureRoute) {
    roleSections.push({
      title: 'LEADER',
      items: [
        { to: '/leader/tasks', icon: ClipboardList, label: 'Task Management' },
        { to: '/leader/reports', icon: BarChart3, label: 'Reports' },
        { to: '/lecture/settings', icon: Settings, label: 'Config Jira/GitHub' },
      ],
    });
  }

  // Lecture section for LECTURER/ADMIN
  if (['LECTURER', 'ADMIN'].includes(normalizedRole) && !isLectureRoute && !isLeaderRoute) {
    roleSections.push({
      title: 'LECTURE',
      items: [
        { to: '/lecture', icon: GraduationCap, label: 'Lecturer Console', end: true },
        { to: '/lecture/github', icon: Github, label: 'GitHub Connector' },
      ],
    });
  }

  // Admin section for ADMIN only
  const adminSection =
    normalizedRole === 'ADMIN'
      ? [
        {
          title: 'ADMIN',
          items: [{ to: '/admin', icon: ShieldCheck, label: 'Admin Panel' }],
        },
      ]
      : [];

  const navSections = [...baseNavSections, ...roleSections, ...adminSection];

  return (
    <aside
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => collapsed && setHovered(false)}
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white shadow-sm transition-all duration-300',
        isExpanded ? 'w-[260px]' : 'w-[72px]',
        collapsed && hovered && 'shadow-xl',
      )}
    >
      {/* Logo + Toggle — same horizontal padding as nav items */}
      <div
        className={cn(
          'flex h-16 items-center',
          isExpanded ? 'justify-between px-5' : 'justify-center',
        )}
      >
        <div
          className={cn(
            'flex items-center overflow-hidden',
            isExpanded ? 'gap-3' : 'justify-center',
          )}
        >
          {/* Logo icon — exactly 20px like nav icons, centered in same 40px hit area */}
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground',
              isExpanded ? 'h-8 w-8 text-sm font-bold' : 'h-9 w-9 text-base font-bold',
            )}
          >
            T
          </div>
          {isExpanded && (
            <span className="whitespace-nowrap text-lg font-bold text-foreground">TaskManager</span>
          )}
        </div>

        {isExpanded && (
          <button
            onClick={onToggleCollapse}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Circle
              size={14}
              className={cn(
                'transition-all',
                collapsed ? 'fill-primary stroke-primary' : 'fill-none',
              )}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        {navSections.map((section) => (
          <div key={section.title} className="px-3 pb-3">
            {isExpanded ? (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                {section.title}
              </p>
            ) : (
              <div className="mb-3 flex justify-center">
                <div className="h-px w-6 bg-border" />
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {section.items.map((item, index) => (
                <NavItem key={item.to || index} item={item} isExpanded={isExpanded} />
              ))}
            </nav>
          </div>
        ))}
      </ScrollArea>
    </aside>
  );
}
