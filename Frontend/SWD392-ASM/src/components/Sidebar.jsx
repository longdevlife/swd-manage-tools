import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  Circle,
  ClipboardList,
  Github,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Settings,
  User,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { selectUserRole } from '@/stores/authSlice';

// ─── NavItem component ──────────────────────────────────────────────────────

function NavItem({ item, isExpanded }) {
  const location = useLocation();
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
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

// ─── Sidebar component ──────────────────────────────────────────────────────

export function Sidebar({ collapsed, onToggleCollapse }) {
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = useSelector(selectUserRole);

  const isExpanded = !collapsed || hovered;
  const isLectureRoute = location.pathname.startsWith('/lecture');
  const isLeaderRoute = location.pathname.startsWith('/leader');
  const isSubSection = isLectureRoute || isLeaderRoute;

  // Normalize role: strip ROLE_ prefix
  const normalizedRole = (userRole || '').replace(/^ROLE_/i, '');

  // ═══ Build navigation sections based on current route + role ═══

  let navSections = [];

  if (isLectureRoute) {
    // ── Lecture sub-section sidebar ──
    navSections = [
      {
        title: 'LECTURE MANAGEMENT',
        items: [
          { to: '/lecture', icon: GraduationCap, label: 'Lecturer Console', end: true },
          { to: '/lecture/github', icon: Github, label: 'GitHub Connector' },
          { to: '/lecture/settings', icon: Settings, label: 'Project Config' },
        ],
      },
    ];
  } else if (isLeaderRoute) {
    // ── Leader sub-section sidebar ──
    navSections = [
      {
        title: 'LEADER MANAGEMENT',
        items: [
          { to: '/leader/tasks', icon: ClipboardList, label: 'Task Management' },
          { to: '/leader/reports', icon: BarChart3, label: 'Reports & Commits' },
          { to: '/leader/settings', icon: Settings, label: 'Config Jira/GitHub' },
        ],
      },
    ];
  } else {
    // ── Main sidebar — show role-based sections ──

    // Common section for all roles
    navSections.push({
      title: 'MAIN',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/tasks', icon: ListTodo, label: 'Tasks Board' },
        { to: '/profile', icon: User, label: 'My Profile' },
      ],
    });

    // Member section (for MEMBER, LEADER — anyone who is in a group)
    if (['MEMBER', 'LEADER', 'ADMIN'].includes(normalizedRole)) {
      navSections.push({
        title: 'MEMBER',
        items: [
          { to: '/my-tasks', icon: ClipboardList, label: 'My Tasks' },
          { to: '/my-stats', icon: BarChart3, label: 'My Statistics' },
        ],
      });
    }

    // Leader section
    if (['LEADER', 'ADMIN'].includes(normalizedRole)) {
      navSections.push({
        title: 'LEADER',
        items: [
          { to: '/leader/tasks', icon: ClipboardList, label: 'Task Management' },
          { to: '/leader/reports', icon: BarChart3, label: 'Reports' },
          { to: '/leader/settings', icon: Settings, label: 'Config Jira/GitHub' },
        ],
      });
    }

    // Lecturer section
    if (['LECTURER', 'ADMIN'].includes(normalizedRole)) {
      navSections.push({
        title: 'LECTURER',
        items: [
          { to: '/lecture', icon: GraduationCap, label: 'Lecturer Console', end: true },
          { to: '/lecture/github', icon: Github, label: 'GitHub Connector' },
          { to: '/lecture/settings', icon: Settings, label: 'Settings' },
        ],
      });
    }

    // Admin section
    if (normalizedRole === 'ADMIN') {
      navSections.push({
        title: 'ADMIN',
        items: [
          { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' },
        ],
      });
    }
  }

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
      {/* Logo + Toggle */}
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

      {/* ── Back Button (when in sub-section) ── */}
      {isSubSection && isExpanded && (
        <div className="px-3 pb-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span>Back to Main Menu</span>
          </button>
          <div className="mt-2 h-px bg-border" />
        </div>
      )}
      {isSubSection && !isExpanded && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Back to Main Menu"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      )}

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
                <NavItem key={item.to + item.label || index} item={item} isExpanded={isExpanded} />
              ))}
            </nav>
          </div>
        ))}
      </ScrollArea>
    </aside>
  );
}
