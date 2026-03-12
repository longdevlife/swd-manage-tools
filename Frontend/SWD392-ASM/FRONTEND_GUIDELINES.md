# 📘 SWD392 – Frontend Developer Guide

---

## 🗂️ Mục lục

1. [Cấu trúc thư mục](#1-cấu-trúc-thư-mục)
2. [Tech Stack](#2-tech-stack)
3. [Design System & Quy tắc UI](#3-design-system--quy-tắc-ui)
4. [Layout System](#4-layout-system)
5. [Routing (Cách thêm trang mới)](#5-routing-cách-thêm-trang-mới)
6. [Components có sẵn](#6-components-có-sẵn)
7. [Quy tắc code chung](#7-quy-tắc-code-chung)
8. [Workflow thực chiến: Ví dụ đầu đến cuối](#8-workflow-thực-chiến-ví-dụ-đầu-đến-cuối)

---

## 1. Cấu trúc thư mục

```
src/
├── components/           # Shared UI components dùng lại nhiều lần
│   ├── ui/               # Shadcn UI primitives (button, card, input, badge...)
│   ├── Sidebar.jsx       # Thanh điều hướng bên trái (đã built sẵn)
│   ├── TopNav.jsx        # Thanh header phía trên (đã built sẵn)
│   ├── PageHeader.jsx    # Tiêu đề trang chuẩn (dùng cho mọi page)
│   ├── EmptyState.jsx    # Màn hình rỗng khi không có dữ liệu
│   └── LoadingSpinner.jsx# Vòng xoay loading
│
├── layouts/              # Bộ khung layout bọc ngoài page
│   └── MainLayout.jsx    # Layout chính: Sidebar + TopNav + nội dung
│
├── pages/                # ⭐ Mỗi trang = 1 file ở đây
│   ├── DashboardPage.jsx
│   ├── TasksPage.jsx
│   └── NotFoundPage.jsx
│
├── routes/               # Khai báo điều hướng URL
│   └── AppRoutes.jsx     # ⭐ Thêm route mới vào đây
│
├── stores/               # Redux Toolkit slices (auth, theme...) — store.js + *Slice.js
├── services/             # Gọi API (axios, fetch wrappers)
├── hooks/                # Custom React hooks
├── utils/                # Hàm tiện ích thuần JS
├── lib/                  # Cấu hình thư viện (shadcn utils, axios instance...)
├── index.css             # ⭐ Toàn bộ CSS variables/tokens (màu, radius...)
└── App.jsx               # Root component
```

> **Nguyên tắc vàng:** Mỗi thứ đặt đúng chỗ. Đừng bỏ component vào `pages/` hay bỏ page logic vào `components/`.

---

## 2. Tech Stack

| Thư viện                 | Vai trò                    | Ghi chú                                   |
| ------------------------ | -------------------------- | ----------------------------------------- |
| **React 19**             | UI framework               | Dùng Function Component + Hooks           |
| **Vite**                 | Build tool                 | Dev server cực nhanh                      |
| **React Router v7**      | Routing                    | `<Routes>`, `<Route>`, `<Outlet>`         |
| **Tailwind CSS v4**      | Styling                    | Class-based utility CSS                   |
| **Shadcn UI**            | Component library          | Built on Radix UI primitives              |
| **Lucide React**         | Icons                      | `import { IconName } from 'lucide-react'` |
| **Redux Toolkit (RTK)**  | Global state               | `@reduxjs/toolkit` + `react-redux`        |
| **TanStack React Query** | Server state / API caching | Fetch + cache + sync data từ API          |
| **Axios**                | HTTP client                | Gọi REST API                              |
| **Sonner**               | Toast notifications        | Thông báo thành công/thất bại             |

---

## 2b. State Management — Redux Toolkit

Project dùng **Redux Toolkit (RTK)** cho global UI state. Cấu trúc:

```
src/stores/
├── store.js          # configureStore — đăng ký tất cả reducers vào đây
└── authSlice.js      # Slice quản lý auth (user, token, isAuthenticated)
```

### Đọc state từ Redux (useSelector)

```jsx
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '@/stores/authSlice';

export function MyComponent() {
  const user = useSelector(selectCurrentUser); // Lấy user hiện tại
  const isAuth = useSelector(selectIsAuthenticated); // Kiểm tra đã login chưa
}
```

### Dispatch action (useDispatch)

```jsx
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from '@/stores/authSlice';

export function LoginPage() {
  const dispatch = useDispatch();

  // Sau khi gọi API login thành công:
  dispatch(setCredentials({ user: data.user, token: data.token }));

  // Đăng xuất:
  dispatch(logout());
}
```

### Thêm Slice mới cho tính năng mới

**Bước 1:** Tạo file slice mới:

```js
// src/stores/tasksSlice.js
import { createSlice } from '@reduxjs/toolkit';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { selectedId: null },
  reducers: {
    selectTask: (state, action) => {
      state.selectedId = action.payload;
    },
    clearSelectedTask: (state) => {
      state.selectedId = null;
    },
  },
});

export const { selectTask, clearSelectedTask } = tasksSlice.actions;
export const selectSelectedTaskId = (state) => state.tasks.selectedId;
export default tasksSlice.reducer;
```

**Bước 2:** Đăng ký vào `store.js`:

```js
// src/stores/store.js
import tasksReducer from './tasksSlice'; // ← import thêm

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer, // ← thêm vào đây
  },
});
```

> ⚠️ **Quy tắc:** Redux **chỉ** dùng cho **global UI state** (trạng thái đăng nhập, ID đang được chọn, modal mở/đóng...). **KHÔNG** lưu data fetch từ API vào Redux — đó là việc của React Query.

---

## 2c. Server State — TanStack React Query

Mọi lần **fetch dữ liệu từ API** đều dùng React Query, **không** dùng `useEffect + useState` thủ công.

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { taskService } from '@/services/taskService'; // Axios wrapper

// ✅ GET — Fetch danh sách
const { data: tasks = [], isLoading } = useQuery({
  queryKey: ['tasks'], // Cache key — unique mỗi resource
  queryFn: () => taskService.getAll(), // Hàm gọi API
});

// ✅ POST — Tạo mới, tự động refresh list
const queryClient = useQueryClient();
const { mutate: createTask, isPending } = useMutation({
  mutationFn: (data) => taskService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Refetch
    toast.success('Task created!');
  },
  onError: () => toast.error('Failed to create task.'),
});
```

---

## 2d. Toast Notifications — Sonner

```jsx
import { toast } from 'sonner';

toast.success('Saved successfully!');
toast.error('Something went wrong.');
toast.info('Syncing data...');
```

> `<Toaster />` đã được mount sẵn trong `App.jsx`. Bạn chỉ cần `import { toast } from 'sonner'` và gọi trực tiếp.

---

## 3. Design System & Quy tắc UI

### Nguyên tắc bất biến (KHÔNG được phép phá vỡ)

**A. Card-based design — Toàn bộ nội dung phải trong `<Card>`**

✅ Đúng:

```jsx
<Card>
  <CardHeader>
    <CardTitle>My Feature</CardTitle>
  </CardHeader>
  <CardContent>Nội dung ở đây</CardContent>
</Card>
```

❌ Sai — Đừng tạo div với border cứng thủ công:

```jsx
<div className="border border-gray-200 rounded p-4">...</div>
```

**B. Màu sắc — Luôn dùng CSS variables, không được hardcode**

✅ Đúng:

```jsx
<p className="text-primary">...</p>       // Màu tím chủ đạo #7367f0
<p className="text-muted-foreground">...</p> // Màu xám mô tả
<div className="bg-background">...</div>   // Nền xám nhạt toàn trang
```

❌ Sai:

```jsx
<p className="text-[#7367f0]">...</p>      // Cứng màu
<p style={{ color: 'purple' }}>...</p>     // Inline style
```

**C. Spacing — Dùng thang Tailwind nhất quán**

| Trường hợp                       | Class dùng                     |
| -------------------------------- | ------------------------------ |
| Khoảng cách giữa các section lớn | `space-y-6` hoặc `gap-6`       |
| Khoảng cách giữa các item nhỏ    | `space-y-3` hoặc `gap-3`       |
| Khoảng cách giữa icon và text    | `gap-2`                        |
| Padding bên trong Card Content   | Mặc định `p-6` (đừng override) |

---

## 4. Layout System

`MainLayout.jsx` là **khung bao bọc** tự động cấp:

- ✅ Sidebar trái (260px mở / 72px thu)
- ✅ TopNav nổi phía trên
- ✅ Container `max-w-[1440px]` căn giữa nội dung
- ✅ Padding 2 bên `px-6 py-6` đồng đều

**Bạn không cần và không được thêm padding/margin ở mức page.** Tất cả các `Page` chỉ cần dùng wrapper `<div className="space-y-6">` là đủ để layout tự canh đúng.

```
┌─────────────────────────────────────────────────┐
│  MainLayout (max-w-[1440px] px-6 py-6 mx-auto)  │
│  ┌─────────────────────────────────────────┐     │
│  │            TopNav (Card)                │     │
│  └─────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────┐     │
│  │   <Outlet /> ← nội dung page của bạn   │     │
│  │   (bao bởi space-y-6)                  │     │
│  └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

---

## 5. Routing (Cách thêm trang mới)

> File điều hướng: **`src/routes/AppRoutes.jsx`** — chỉ sửa file này để thêm route.

### Quy trình 3 bước (BẮT BUỘC tuân thủ đúng thứ tự)

#### Bước 1 — Tạo file Page trong `src/pages/`

```jsx
// src/pages/MembersPage.jsx
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function MembersPage() {
  return (
    <div className="space-y-6">
      {/* 1. Header — LUÔN PHẢI CÓ */}
      <PageHeader
        title="Members"
        description="Manage team members and their permissions."
        actions={<Button>Add Member</Button>}
      />

      {/* 2. Nội dung bọc trong Card */}
      <Card>
        <CardContent className="pt-6">
          {/* Khi chưa có data — dùng EmptyState */}
          <EmptyState
            icon={<Users size={40} />}
            title="No members yet"
            description="Invite people to collaborate on your team."
            action={<Button>Invite Member</Button>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Bước 2 — Thêm mục vào Sidebar

```jsx
// src/components/Sidebar.jsx — Thêm vào mảng navSections
import { Users } from 'lucide-react';

const navSections = [
  {
    title: 'APPS & PAGES',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/tasks', icon: ListTodo, label: 'Tasks' },
      { to: '/members', icon: Users, label: 'Members' }, // ← thêm đây
    ],
  },
];
```

#### Bước 3 — Đăng ký Route trong `AppRoutes.jsx`

```jsx
// src/routes/AppRoutes.jsx
import { MembersPage } from '@/pages/MembersPage'; // 1. Import

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/members" element={<MembersPage />} /> {/* 2. Thêm route */}
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

> **Lưu ý quan trọng:** Route cho page mới **phải nằm bên trong** `<Route element={<MainLayout />}>` để thừa hưởng Sidebar, TopNav, và toàn bộ padding của layout. Nếu bạn đặt ra ngoài, trang sẽ hiện ra trơ khấc không có layout.

---

## 6. Components có sẵn

### `<PageHeader>` — Tiêu đề trang chuẩn

Dùng cho **mọi trang**, không được tự tay code `<h1>` độc lập.

```jsx
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

// Chỉ có tiêu đề
<PageHeader title="Reports" description="Overview of project progress." />

// Có nút hành động bên phải
<PageHeader
  title="Tasks"
  description="Manage your team's tasks."
  actions={
    <>
      <Button variant="outline">Export</Button>
      <Button>Create Task</Button>
    </>
  }
/>
```

### `<EmptyState>` — Màn hình rỗng

Dùng khi fetch API xong nhưng list trả về rỗng `[]`.

```jsx
import { EmptyState } from '@/components/EmptyState';
import { FileText } from 'lucide-react';

{
  tasks.length === 0 && (
    <EmptyState
      icon={<FileText size={36} />}
      title="No tasks found"
      description="Create your first task to get started."
      action={<Button>Create Task</Button>}
    />
  );
}
```

### `<LoadingSpinner>` — Trạng thái loading

Dùng trong khi chờ API response.

```jsx
import { LoadingSpinner } from '@/components/LoadingSpinner';

{
  isLoading && <LoadingSpinner size="lg" text="Loading tasks..." />;
}
```

### `<Card>` — Thẻ nội dung (quan trọng nhất)

Đã custom: **không viền, shadow mềm**.

```jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Task Details</CardTitle>
    <CardDescription>Last updated 2 hours ago</CardDescription>
  </CardHeader>
  <CardContent>{/* Nội dung chính */}</CardContent>
  <CardFooter className="gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>;
```

### `<Button>` — Các loại nút

```jsx
import { Button } from '@/components/ui/button';

<Button>Lưu</Button>                          // Tím — Hành động chính
<Button variant="secondary">Hủy</Button>      // Xám — Hành động phụ
<Button variant="outline">Lọc</Button>        // Viền — Dùng cho filter/export
<Button variant="destructive">Xóa</Button>    // Đỏ — Nguy hiểm (delete)
<Button size="icon" variant="outline">        // Icon vuông
  <Plus className="h-4 w-4" />
</Button>
```

### `<Badge>` — Nhãn trạng thái

```jsx
import { Badge } from '@/components/ui/badge';

<Badge>In Progress</Badge>             // Tím — trạng thái active
<Badge variant="secondary">Done</Badge>       // Xám — hoàn thành
<Badge variant="outline">In Review</Badge>    // Viền — đang review
<Badge variant="destructive">Blocked</Badge>  // Đỏ — bị block
```

---

## 7. Quy tắc code chung

### Import Order (ESLint sẽ báo lỗi nếu sai)

```jsx
// 1. Thư viện bên ngoài (node_modules)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

// 2. Internal imports — alias @/
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
```

### Naming Conventions

| Thứ                | Quy tắc               | Ví dụ                           |
| ------------------ | --------------------- | ------------------------------- |
| File Component     | PascalCase            | `MembersPage.jsx`               |
| Function/Component | PascalCase            | `export function MembersPage()` |
| Variables          | camelCase             | `const taskList = []`           |
| CSS class          | kebab-case (Tailwind) | `font-bold`, `text-primary`     |
| File utility       | camelCase             | `formatDate.js`                 |

### Điều cần tránh tuyệt đối

- ❌ Không dùng `class` (dùng `className`) — React yêu cầu
- ❌ Không dùng `inline style` — `style={{ color: 'red' }}` — dùng Tailwind thay
- ❌ Không hardcode màu hex — dùng `text-primary`, `text-muted-foreground`
- ❌ Không set kích thước cố định cho Card/Container — `h-[400px]` sẽ vỡ trên màn hình nhỏ
- ❌ Không thêm padding/margin vào root `div` của Page — layout đã xử lý rồi

---

## 8. Workflow thực chiến: Ví dụ đầu đến cuối

> **Yêu cầu:** Tạo trang "Reports" hiển thị danh sách báo cáo từ API.

```jsx
// src/pages/ReportsPage.jsx
import { useState, useEffect } from 'react';
import { FileBarChart } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Gọi API thực tế ở đây — ví dụ: reportsService.getAll()
    setTimeout(() => {
      setReports([]); // Tạm thời rỗng
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Reports"
        description="View analytics and project progress reports."
        actions={<Button>Export PDF</Button>}
      />

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Project Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner size="lg" text="Loading reports..." />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<FileBarChart size={36} />}
              title="No reports yet"
              description="Reports will appear here once generated."
            />
          ) : (
            <ul>
              {reports.map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

Sau đó đăng ký **Sidebar** và **Route** theo đúng 3 bước ở mục 5 bên trên là xong!

---
