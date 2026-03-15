import { Outlet } from 'react-router-dom';
import { GalleryVerticalEnd } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Left Panel — Dark branding ──────────────────────── */}
      <div className="relative hidden flex-col justify-between bg-zinc-900 p-10 text-white lg:flex">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* Logo */}
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="h-4 w-4" />
          </div>
          SWD392
        </div>

        {/* Center quote */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              &ldquo;Hệ thống giúp chúng tôi theo dõi tiến độ dự án, đồng bộ Jira & GitHub,
              và đánh giá đóng góp từng thành viên một cách minh bạch.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">
              SWD392 — Project Management System
            </footer>
          </blockquote>
        </div>
      </div>

      {/* ── Right Panel — Auth form ─────────────────────────── */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[380px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
