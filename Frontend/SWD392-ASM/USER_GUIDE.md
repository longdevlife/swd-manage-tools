# 📖 Hướng Dẫn Sử Dụng Frontend — TaskManager

> **URL**: `http://localhost:5173`  
> **Backend**: `http://localhost:3000` (phải chạy trước)

---

## 1️⃣ Đăng Ký & Đăng Nhập

### Đăng ký tài khoản mới
1. Mở `http://localhost:5173/login`
2. Bấm **"Register"** để chuyển sang form đăng ký
3. Điền:
   - **Full Name**: Tên đầy đủ
   - **Email**: Email (dùng để login)
   - **Password**: Mật khẩu (tối thiểu 6 ký tự)
   - **Role**: Chọn 1 trong 3:
     - `Member (Sinh viên)` — thành viên nhóm
     - `Leader (Trưởng nhóm)` — quản lý task + config Jira/GitHub
     - `Lecturer (Giảng viên)` — giám sát nhiều nhóm
4. Bấm **"Create Account"**

### Đăng nhập
1. Nhập **Email** + **Password** → bấm **"Sign In"**
2. Hoặc bấm **"Continue with Google"** (OAuth)
3. Sau khi login → tự động redirect sang `/dashboard`

> ⚠️ **Tài khoản Admin**: Chỉ tạo được từ database, không có trên form đăng ký.

---

## 2️⃣ Dashboard (Trang chủ)

**URL**: `/dashboard`

- Hiển thị tổng quan nhóm: số thành viên, issues, commits
- Nút **"Full Sync"**: Đồng bộ Jira + GitHub cho nhóm (gọi `manualSyncApi`)
- Widget thống kê nhanh

---

## 3️⃣ Theo Role — Bạn thấy gì trên Sidebar?

### 👤 MEMBER (Sinh viên)

| Menu | URL | Mô tả |
|------|-----|--------|
| My Tasks | `/my-tasks` | Xem task Jira được gán cho mình, **cập nhật trạng thái** (To Do → In Progress → Done) |
| My Statistics | `/my-stats` | Thống kê cá nhân: commits, issues resolved, contribution % |

**Workflow Member:**
1. Vào **My Tasks** → thấy danh sách issues Jira gán cho bạn
2. Bấm nút chuyển trạng thái trên mỗi task (To Do → In Progress → Done)
3. Backend tự động gọi Jira Transitions API để sync lên Jira Cloud
4. Vào **My Statistics** xem đóng góp cá nhân

---

### 👑 LEADER (Trưởng nhóm)

| Menu | URL | Mô tả |
|------|-----|--------|
| Task Management | `/leader/tasks` | Xem toàn bộ Jira issues của nhóm + **gán task cho member** |
| Reports | `/leader/reports` | Thống kê nhóm: contribution, commits, GitHub history |
| Config Jira/GitHub | `/lecture/settings` | Cấu hình Jira Cloud + GitHub repo cho nhóm |

**Workflow Leader:**

#### Bước 1: Cấu hình Jira + GitHub
1. Vào **Config Jira/GitHub** (hoặc sidebar → "Config Jira/GitHub")
2. **Jira Config**:
   - `Base URL`: `https://your-org.atlassian.net`
   - `Project Key`: Key dự án trên Jira (vd: `SWP`)
   - `Email`: Email tài khoản Atlassian
   - `API Token`: Tạo từ [Atlassian API tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
3. **GitHub Config**:
   - `Repository URL`: `https://github.com/org/repo`
   - `Personal Access Token`: Tạo từ GitHub Settings → Developer settings → Personal access tokens
4. Bấm **"Save"** cho mỗi section

#### Bước 2: Sync dữ liệu
1. Vào **Task Management** → bấm **"Sync Jira"** để pull issues từ Jira Cloud
2. Hoặc vào **Reports** → bấm **"Sync"** để sync cả Jira + GitHub

#### Bước 3: Gán task cho member
1. Vào **Task Management** → thấy board/list toàn bộ Jira issues
2. Trên mỗi issue, bấm **Assign** → chọn member → bấm xác nhận
3. Backend gọi Jira API gán assignee trên Jira Cloud luôn

#### Bước 4: Xem báo cáo
1. Vào **Reports** → bấm **"Generate Report"** để tạo báo cáo contribution
2. Xem bảng đóng góp từng member (commits, issues resolved, %)
3. Scroll xuống xem **GitHub Commits** history

---

### 🎓 LECTURER (Giảng viên)

| Menu | URL | Mô tả |
|------|-----|--------|
| Lecturer Console | `/lecture` | Quản lý sinh viên + xem issues + reports |
| GitHub Connector | `/lecture/github` | Xem GitHub config + kết nối |
| Settings | `/lecture/settings` | Cấu hình Jira/GitHub (giống Leader) |

**Workflow Lecturer:**

#### Quản lý sinh viên
1. Vào **Lecturer Console** → Tab **"Students"**
2. Chọn nhóm từ dropdown (nếu có nhiều nhóm)
3. Bấm **"Add Member"** → search user → thêm vào nhóm
4. Bấm icon **🗑️** để xóa member khỏi nhóm

#### Xem Jira Issues của nhóm
1. Tab **"Jira Issues"** → thấy toàn bộ issues của nhóm
2. Filter theo status, priority, assignee

#### Xem báo cáo
1. Tab **"Reports"** → xem contribution reports
2. Bấm **"Sync All"** để sync Jira + GitHub cho tất cả nhóm

---

### 🛡️ ADMIN

| Menu | URL | Mô tả |
|------|-----|--------|
| Admin Panel | `/admin` | CRUD Groups + Users, gán Lecturer vào nhóm |

**Workflow Admin:**
1. Vào **Admin Panel** → thấy danh sách nhóm
2. **Tạo nhóm mới**: Bấm "Create Group" → điền tên → bấm Save
3. **Quản lý nhóm**: Bấm vào nhóm → xem members, leader, lecturer
4. **Quản lý users**: Tab Users → tạo/xóa tài khoản
5. **Gán Lecturer**: Vào group detail → thêm Lecturer assignment

---

## 4️⃣ Các trang chung (mọi role)

| Trang | URL | Mô tả |
|-------|-----|--------|
| Dashboard | `/dashboard` | Tổng quan + Full Sync |
| Tasks | `/tasks` | Kanban board chung |
| Profile | `/profile` | Xem/sửa thông tin cá nhân |

---

## 5️⃣ Luồng chính (Business Flows)

### Flow 1: Leader gán task → Member nhận
```
Leader: /leader/tasks → Assign → chọn member
  ↓ Backend gọi Jira API
Member: /my-tasks → thấy task mới xuất hiện
```

### Flow 2: Member cập nhật trạng thái
```
Member: /my-tasks → bấm chuyển status (To Do → Done)
  ↓ Backend gọi Jira Transitions API
Jira Cloud: Issue tự cập nhật status
```

### Flow 3: Sync dữ liệu
```
Bất kỳ ai: Bấm "Sync" 
  ↓ Backend pull issues từ Jira + commits từ GitHub
  ↓ Lưu vào database
FE: Refresh → thấy dữ liệu mới
```

### Flow 4: Báo cáo contribution
```
Leader/Lecturer: Bấm "Generate Report"
  ↓ Backend tính contribution dựa trên commits + issues
  ↓ Trả về % đóng góp từng member
```

---

## 6️⃣ Khởi động nhanh

```bash
# Terminal 1: Backend
cd swd-be
npm run dev          # → http://localhost:3000

# Terminal 2: Frontend  
cd Frontend/SWD392-ASM
npm run dev          # → http://localhost:5173
```

### Test nhanh:
1. Mở `http://localhost:5173/login`
2. Đăng ký tài khoản Leader → Login
3. Vào Config Jira/GitHub → nhập thông tin
4. Vào Task Management → Sync Jira → Assign task
5. Đăng ký tài khoản Member (tab ẩn danh) → Login
6. Vào My Tasks → thấy task đã được gán
