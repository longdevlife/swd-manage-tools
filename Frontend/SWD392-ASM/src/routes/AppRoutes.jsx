import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminPage } from '@/pages/admin/AdminPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { GitHubConnectorPage } from '@/pages/lecture/GitHubConnectorPage';
import { LecturerConsolePage } from '@/pages/lecture/LecturerConsolePage';
import { LectureSettingsPage } from '@/pages/lecture/LectureSettingsPage';
import { LeaderTasksPage } from '@/pages/leader/LeaderTasksPage';
import { LeaderReportsPage } from '@/pages/leader/LeaderReportsPage';
import { LoginPage } from '@/pages/LoginPage';
import { MemberStatsPage } from '@/pages/member/MemberStatsPage';
import { MemberTasksPage } from '@/pages/member/MemberTasksPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TasksPage } from '@/pages/TasksPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* ── Auth Routes (AuthLayout — split-screen, no sidebar) ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* ── Google OAuth callback (full-screen, no layout) ── */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* ── Main App Routes (MainLayout — sidebar + topnav) ── */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />

        {/* Profile Routes */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Lecture Routes */}
        <Route path="/lecture" element={<LecturerConsolePage />} />
        <Route path="/lecture/github" element={<GitHubConnectorPage />} />
        <Route path="/lecture/settings" element={<LectureSettingsPage />} />

        {/* Member Routes */}
        <Route path="/my-tasks" element={<MemberTasksPage />} />
        <Route path="/my-stats" element={<MemberStatsPage />} />

        {/* Leader Routes */}
        <Route path="/leader/tasks" element={<LeaderTasksPage />} />
        <Route path="/leader/reports" element={<LeaderReportsPage />} />

        {/* Admin Routes — ROLE_ADMIN only */}
        <Route
          path="/admin"
          element={
            // <ProtectedRoute role="ROLE_ADMIN">
            <AdminPage />
            // </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirects & Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
