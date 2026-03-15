# Frontend Integration Roadmap & Testing Guide

> **Cập nhật:** 15/03/2026 — Sau khi deep review toàn bộ 36 BE endpoints vs 15 FE pages

---

## Tổng quan Coverage

| Metric | Số lượng |
|--------|----------|
| BE API Endpoints | 36 |
| FE API Functions | 36 (100%) |
| FE Pages gọi real APIs | 13/15 (87%) |
| Tổng endpoints có UI | 34/36 (94%) |

---

## Status — Phases

| Phase | Tên | Status | Ghi chú |
|-------|-----|--------|---------|
| 1 | Auth flow (Login + Register + Google OAuth + Callback) | ✅ DONE | Role selector + normalize user object |
| 2 | AdminPage (Groups CRUD + Members + Leader + Lecturer + Jira) | ✅ DONE | 1445 LOC, 12 APIs |
| 3 | Leader pages (Tasks + Reports — real Jira + Reports API) | ✅ DONE | 891 + 363 LOC |
| 4 | Member pages (Tasks + Stats — real Jira + GitHub + Reports API) | ✅ DONE | 517 + 526 LOC |
| 5 | Lecturer pages (Console + GitHub Connector — real APIs) | ✅ DONE | 321 + 513 LOC |
| 6 | Dashboard (role-aware real stats) | ✅ DONE | 372 LOC, 5 APIs |
| 7 | RBAC Sidebar + ProtectedRoute | ✅ DONE | Normalize role prefix, conditional sections |
| 8 | LectureSettingsPage refactor | ⬜ TODO | Hiện chỉ static form |
| 9 | Cleanup + Error handling chuẩn hóa | ⬜ TODO | |

---

## Hướng dẫn chạy dự án

### Prerequisites
```bash
# Node.js >= 18
node -v

# Backend (.env phải có DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
cd swd-be
npm install
npm run dev          # → http://localhost:5000

# Frontend
cd Frontend/SWD392-ASM
npm install
npm run dev          # → http://localhost:5173
```

### Vite Proxy
FE proxy `/api` → `http://localhost:5000` (config trong `vite.config.js`).
Không cần set `VITE_API_BASE_URL` khi dev local.

---

## Hướng dẫn Test theo Role

### 🔐 Bước 1 — Tạo tài khoản

Mở `http://localhost:5173/login` → click **"Sign up"**

| Trường | Giá trị test |
|--------|-------------|
| Full Name | `Test Admin` / `Test Leader` / `Test Lecturer` / `Test Member` |
| Email | `admin@test.com` / `leader@test.com` / `lecturer@test.com` / `member@test.com` |
| Password | `Test123456` |
| Role | Chọn tương ứng |

> **Lưu ý:** Sau register, hệ thống tự động login + redirect về `/dashboard`

---

### 👑 Test Role: ADMIN

**Sidebar sẽ hiện:** APPS & PAGES + SETTINGS + LEADER + LECTURE + ADMIN

| # | Test Case | URL | Hành động | Kết quả mong đợi |
|---|-----------|-----|-----------|-------------------|
| A1 | Xem Dashboard | `/dashboard` | Mở trang | Hiện "Admin Dashboard" với stats tổng |
| A2 | Admin Panel — Users Tab | `/admin` | Click tab "Users" | Bảng danh sách users từ API, filter theo role |
| A3 | Admin Panel — Groups Tab | `/admin` | Click tab "Groups" | CRUD groups: Create, Edit, Delete |
| A4 | Tạo Group mới | `/admin` | Tab Groups → "Create Group" | Điền tên + submit → group mới xuất hiện |
| A5 | Thêm member vào group | `/admin` | Expand group → "Add Member" | Chọn user → member xuất hiện trong bảng |
| A6 | Assign Leader | `/admin` | Expand group → "Assign Leader" | Chọn member → badge Leader hiện |
| A7 | Assign Lecturer | `/admin` | Expand group → "Assign Lecturer" | Chọn lecturer → hiện trong group |
| A8 | Config Jira cho group | `/admin` | Tab Jira → Chọn group → nhập Jira info | Test connection → save config |
| A9 | Leader Task Management | `/leader/tasks` | Mở trang | Hiện Jira issues (nếu đã config) |
| A10 | Lecturer Console | `/lecture` | Mở trang | Hiện danh sách groups + students |

---

### 🎯 Test Role: LEADER

**Sidebar sẽ hiện:** APPS & PAGES + SETTINGS + LEADER

| # | Test Case | URL | Hành động | Kết quả mong đợi |
|---|-----------|-----|-----------|-------------------|
| L1 | Leader Dashboard | `/dashboard` | Mở trang | "Leader Dashboard" + stats nhóm |
| L2 | Task Management | `/leader/tasks` | Mở trang | Danh sách Jira issues + filter + assign |
| L3 | Assign task cho member | `/leader/tasks` | Click issue → Assign | Chọn member → issue assigned |
| L4 | Update status | `/leader/tasks` | Click issue → Change status | Status cập nhật (To Do → In Progress) |
| L5 | Sync Jira | `/leader/tasks` | Click "Sync" | Toast "Syncing..." → data refreshed |
| L6 | Reports | `/leader/reports` | Mở trang | Contribution reports từ API |
| L7 | Generate report | `/leader/reports` | Click "Generate Report" | Report mới được tạo |
| L8 | My Tasks | `/my-tasks` | Mở trang | Issues assigned cho user hiện tại |
| L9 | My Stats | `/my-stats` | Mở trang | Jira stats + GitHub commits + report |

---

### 📚 Test Role: LECTURER

**Sidebar sẽ hiện:** APPS & PAGES + SETTINGS + LECTURE

| # | Test Case | URL | Hành động | Kết quả mong đợi |
|---|-----------|-----|-----------|-------------------|
| T1 | Lecturer Console | `/lecture` | Mở trang | Bảng students across groups |
| T2 | Filter by group | `/lecture` | Chọn group từ dropdown | Chỉ hiện students của group đó |
| T3 | Search student | `/lecture` | Nhập tên/email | Bảng filter realtime |
| T4 | GitHub Connector | `/lecture/github` | Mở trang | Danh sách repos + commits per group |
| T5 | Config GitHub repo | `/lecture/github` | "Add Repository" → nhập repo URL | Config saved |
| T6 | Sync commits | `/lecture/github` | Click "Sync" trên repo | Commits refreshed từ GitHub |

---

### 👤 Test Role: MEMBER

**Sidebar sẽ hiện:** APPS & PAGES + SETTINGS (không có Leader/Lecture/Admin)

| # | Test Case | URL | Hành động | Kết quả mong đợi |
|---|-----------|-----|-----------|-------------------|
| M1 | Member Dashboard | `/dashboard` | Mở trang | "Member Dashboard" + personal stats |
| M2 | My Tasks | `/my-tasks` | Mở trang | Issues assigned cho mình |
| M3 | Update task status | `/my-tasks` | Click issue → Change status | Status updated |
| M4 | My Statistics | `/my-stats` | Mở trang | Jira completion + GitHub commits + report |
| M5 | Profile | `/profile` | Mở trang | Xem/edit profile (tên, email, phone) |

---

### 🔒 Test RBAC (Access Control)

| # | Test Case | Hành động | Kết quả mong đợi |
|---|-----------|-----------|-------------------|
| R1 | Member không vào Admin | Login MEMBER → gõ `/admin` | Redirect về `/dashboard` |
| R2 | Leader không vào Admin | Login LEADER → gõ `/admin` | Redirect về `/dashboard` |
| R3 | Sidebar ẩn đúng | Login MEMBER | Không thấy LEADER, LECTURE, ADMIN sections |
| R4 | Sidebar hiện đúng | Login ADMIN | Thấy tất cả sections |
| R5 | Logout + re-login | Click avatar → Logout → Login lại với role khác | Sidebar cập nhật theo role mới |

---

### 🔑 Test Auth Flow

| # | Test Case | Hành động | Kết quả mong đợi |
|---|-----------|-----------|-------------------|
| F1 | Email Login | Nhập email + password → "Sign In" | Redirect → Dashboard |
| F2 | Register + Role | Click "Sign up" → điền form + chọn role → "Create Account" | Toast "Đăng ký thành công" → Dashboard |
| F3 | Google OAuth | Click "Sign in with Google" | Redirect Google → callback → Dashboard |
| F4 | Email trùng | Register với email đã tồn tại | Toast "Email already registered" |
| F5 | Sai password | Login với sai password | Toast "Invalid email or password" |
| F6 | Session persist | Login → close tab → mở lại `localhost:5173` | Vẫn ở Dashboard (không bị redirect login) |
| F7 | Logout | Click avatar → Logout | Redirect về `/login`, xoá localStorage |

---

## API Layer — Files Reference

| File | APIs | Dùng ở Pages |
|------|------|-------------|
| `features/auth/api/authApi.js` | login, register, getMe, googleLogin, googleCallback | LoginPage, AuthCallbackPage |
| `features/groups/api/groupsApi.js` | getGroups, getGroupById, createGroup, updateGroup, deleteGroup, getMembers, addMember, removeMember, assignLeader, getLeader, getLecturers, assignLecturer, removeLecturer | AdminPage, DashboardPage, LecturerConsolePage, GitHubConnectorPage |
| `features/jira/api/jiraApi.js` | configureJira, getJiraConfig, testJiraConnection, syncJiraIssues, getJiraIssues, updateIssueStatus, assignIssue | AdminPage, LeaderTasksPage, MemberTasksPage, DashboardPage, LeaderReportsPage |
| `features/github/api/githubApi.js` | configureGitHub, getGitHubConfig, syncCommits, getCommits, getCommitStats | GitHubConnectorPage, MemberStatsPage, DashboardPage |
| `features/reports/api/reportsApi.js` | getReports, generateReport, getMyReport | LeaderReportsPage, MemberStatsPage |
| `features/sync/api/syncApi.js` | manualSync | DashboardPage |
| `features/users/api/usersApi.js` | getUsers, updateUserProfile | AdminPage, ProfilePage |

---

## Bugs đã fix (15/03/2026)

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `axiosClient.js` | baseURL `localhost:8080` bypass Vite proxy | → `/api` (qua proxy port 5000) |
| 2 | `authSlice.js` | `selectUserRole` chỉ đọc `role` string | → Support cả `role` + `roles[]` |
| 3 | `ProtectedRoute.jsx` | So sánh `role !== 'ROLE_ADMIN'` sai format | → Normalize ROLE_ prefix |
| 4 | `Sidebar.jsx` | Hardcode `'ROLE_ADMIN'`, thiếu RBAC sections | → Normalize + thêm Leader/Lecturer sections |
| 5 | `LoginPage.jsx` | Không normalize user object sau login/register | → `{ role: roles[0], roles }` |
