import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left Side — Branding */}
      <div className="hidden w-1/2 items-center justify-center bg-primary/5 lg:flex">
        <div className="max-w-md text-center">
          <div className="mb-6 text-6xl">📋</div>
          <h1 className="text-3xl font-bold text-foreground">
            SWD392 Task Manager
          </h1>
          <p className="mt-3 text-muted-foreground">
            Hệ thống quản lý công việc nhóm — Giúp team bạn làm việc hiệu quả hơn.
          </p>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
