# PROJECT KNOWLEDGE: Jira & GitHub Project Progress Management (SWP391)

## I. Project Overview
- **Objective:** Developing a tool to manage requirements, progress, and evaluating student contribution in the Software Project Course (SWP391) by explicitly integrating Jira (Tasks) and GitHub (Commits/Code).
- **Core Value:** Helping Software Engineering students practice modern workflow approaches while helping Lecturers track individual contributions fairly based on Commit statistics and Jira task resolutions.
- **System Role:** The Web App acts as **"Master Control"** — all operations (assign task, update status, sync data) go through the system's Backend first, then Backend calls Jira/GitHub APIs to synchronize.

## II. Tech Stack & Architecture
- **Architecture Base:** Layered Monolith (Shared codebase, shared database, split by logical domains).
- **Environment:** Node.js (v22+) with ES Modules (`type: "module"` in package.json).
- **Web Framework:** Express.js + CORS + Morgan.
- **ORM & Database:** **Prisma v7 (Code-First) + Neon PostgreSQL**.
- **Authentication:** Passport.js (Google OAuth 2.0) + Stateless JWT (`jsonwebtoken`), and BCrypt for standard passwords.
- **API Docs:** Scalar UI (`@scalar/express-api-reference`) + `swagger-jsdoc` tại `/api/docs`.
- **Frontend:** Nằm trong folder `Frontend/SWD392-ASM/` (đã có sẵn trong repo).

## III. Database Schema (13 bảng - từ `1234.ipynb`)

| # | Bảng | PK | Mô tả | Ràng buộc đặc biệt |
|---|------|----|-------|---------------------|
| 1 | `User` | `user_id` | Thông tin user (+ password, google_id cho Auth) | `email` UNIQUE |
| 2 | `Role` | `role_id` | ADMIN, LECTURER, LEADER, MEMBER | `role_name` UNIQUE |
| 3 | `User_Role` | `(user_id, role_id)` | N-N: User ↔ Role | |
| 4 | `Student_Group` | `group_id` | Nhóm SV (tên, kỳ học, tên dự án) | |
| 5 | `Group_Member` | `(group_id, user_id)` | N-N: User thuộc nhóm nào | |
| 6 | `Group_Leader` | `group_id` | 1 leader/nhóm | PK = group_id (1:1) |
| 7 | `Lecturer_Assignment` | `(lecturer_id, group_id)` | Giảng viên phụ trách nhóm | N-N |
| 8 | `Jira_Project` | `jira_project_id` | Config Jira cho nhóm | `group_id` UNIQUE (1:1) |
| 9 | `Jira_Issue` | `jira_issue_id` | Issues sync từ Jira | FK → Jira_Project |
| 10 | `Git_Repository` | `repo_id` | Config GitHub repo cho nhóm | `group_id` UNIQUE (1:1) |
| 11 | `Commit_Record` | `commit_id` | Commits sync từ GitHub | `commit_hash` UNIQUE |
| 12 | `Commit_Issue` | `(commit_id, jira_issue_id)` | Link commit ↔ Jira issue | N-N |
| 13 | `Contribution_Report` | `report_id` | Báo cáo đóng góp tổng hợp | |

## IV. Roles & Permissions (RBAC)

### ADMIN
- CRUD Student_Group
- CRUD User (accounts) — quản lý tài khoản Lecturer & Student
- Gán Lecturer vào nhóm (Lecturer_Assignment)

### LECTURER
- Xem nhóm được phân công (filter by Lecturer_Assignment)
- Thêm/xóa sinh viên trong nhóm (Group_Member)
- Xem Jira Issues (requirements & tasks) của nhóm
- Xem báo cáo tiến độ (Contribution_Report)
- Xem thống kê GitHub commits
- Trigger Manual Sync

### LEADER (Team Leader)
- Cấu hình Jira Project cho nhóm (project_key, base_url)
- Cấu hình Git Repository cho nhóm (repo_url)
- Quản lý Jira issues (CRUD trên hệ thống → sync lên Jira)
- Gán task cho member (trên Web → Backend push lên Jira API)
- Theo dõi tiến độ task
- Xem commit summaries của team
- Trigger Manual Sync

### MEMBER (Team Member)
- Xem task được gán (filter Jira issues by assignee)
- Cập nhật trạng thái task (trên Web → Backend call Jira Transitions API)
- Xem thống kê cá nhân (commits, lines, issues resolved)

## V. Core Business Flow

### Flow 1: Task Assignment (Leader → Member)
```
Leader chọn Member trên Web UI
  → Backend API nhận request
  → Lưu vào DB nội bộ
  → Backend gọi Jira API để sync assignee lên Jira
```

### Flow 2: Task Status Update (Member)
```
Member bấm "Hoàn thành" trên Web UI
  → Backend API: PUT /api/groups/:id/jira/issues/:issueId/status
  → Backend gọi Jira Transitions API (/rest/api/2/issue/{key}/transitions)
  → Cập nhật status trên cả DB nội bộ và Jira
```
*Hỗ trợ cả 2 chiều: Member có thể thao tác trên Jira, khi sync sẽ tự cập nhật DB.*

### Flow 3: Sync Jira & GitHub (Kết hợp Manual + Cron)
```
Trigger (Manual hoặc Cron job)
  → Gọi Jira API → Lưu/upsert Jira_Issue
  → Gọi GitHub API → Lưu/upsert Commit_Record
  → Parse commit message bằng Regex (/[A-Z]+-\d+/)
  → Tìm Jira_Issue matching → Tạo Commit_Issue
  → Tính toán Contribution_Report
```
- **Manual:** API `POST /api/groups/:id/sync` cho Leader/Lecturer bấm nút "Sync Now"
- **Cron:** Dùng `node-cron` chạy định kỳ (1h hoặc 12h)

### Flow 4: Commit ↔ Issue Linking (TỰ ĐỘNG)
```
Quy ước commit message: "SWP-123: fix login bug"
  → Backend parse Regex: /[A-Z]+-\d+/
  → Tìm Jira_Issue WHERE issue_key = 'SWP-123'
  → Nếu match → INSERT Commit_Issue(commit_id, jira_issue_id)
```
*Không nhập tay. Bắt buộc tự động parse.*

## VI. Core Business Rules (BR)

- **BR-03 (Role Checking):** Middleware `authorize("ADMIN", "LECTURER")` kiểm tra role từ `User_Role`.
- **BR-04 (Data Scope):** Lecturer/Member chỉ xem data của nhóm mình (`sameGroupOnly` middleware).
- **BR-08 (Credential Privacy):** Jira API Tokens & GitHub PATs phải encrypt (AES-256) trước khi lưu DB.
- **BR-09 (Bidirectional Sync):** Hệ thống là Master Control — thao tác trên Web push lên Jira/GitHub, đồng thời sync ngược về khi Cron/Manual trigger.

## VII. Development Guidelines

1. **Folder Structure (`src/`)**:
    - `/config`: DB Connection (Prisma Singleton), Passport, Swagger.
    - `/controllers`: Request Handlers.
    - `/routes`: Express routes bound to controllers.
    - `/middlewares`: JWT `protect`, RBAC `authorize`, scope `sameGroupOnly`, `errorHandler`.
    - `/docs`: JSDoc OpenAPI annotations cho swagger-jsdoc.
    - `/generated/prisma`: **Do not commit / Do not edit.**

2. **Schema Management (Prisma)**:
    - Sửa `schema.prisma` → `npx prisma db push` → `npx prisma generate`
    - Connection URL nằm trong `prisma.config.ts`.

3. **API Documentation (Scalar)**:
    - Thêm route mới → tạo file JSDoc trong `src/docs/` (VD: `groupDocs.js`)
    - swagger-jsdoc tự scan `./src/routes/*.js` + `./src/docs/*.js`
    - UI: `http://localhost:5000/api/docs` | Raw spec: `/api/docs/spec`

4. **Milestones**:
    - ✅ Phase 1: Initial MVC Setup, ES Modules
    - ✅ Phase 2: Prisma v7 + Neon PostgreSQL migration
    - ✅ Phase 3: Database schema (13 tables from `1234.ipynb`)
    - ✅ Phase 4: JWT Auth + Google OAuth + RBAC
    - ✅ Phase 5: Scalar API Docs setup
    - ⬜ Phase 6: Group Management APIs
    - ⬜ Phase 7: Jira Integration (Adapter + Sync)
    - ⬜ Phase 8: GitHub Integration (Adapter + Sync)
    - ⬜ Phase 9: Contribution Reporting
    - ⬜ Phase 10: Cron Job + Manual Sync

## VIII. Environmental Variables (`.env`)
```env
PORT=5000
NODE_ENV=development

# Neon Database
DATABASE_URL="postgresql://<user>:<password>@<ep-pooler>.neon.tech/neondb?sslmode=require"

# Auth
JWT_SECRET="supersecret_jwt_key"
JWT_EXPIRES_IN="7d"

# Encryption (Jira/GitHub credentials)
ENCRYPTION_KEY="32_byte_hex_string_key_for_aes_256"

# Google OAuth
GOOGLE_CLIENT_ID="[GCP_Client_ID]"
GOOGLE_CLIENT_SECRET="[GCP_Secret]"
SESSION_SECRET="session_secret_for_passport"
CLIENT_URL="http://localhost:3000"
```
