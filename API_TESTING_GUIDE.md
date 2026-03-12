# 📋 API Testing Guide — SWP391 Project Management Backend

> **Base URL:** `http://localhost:5000`
> **API Docs (Scalar UI):** `http://localhost:5000/api/docs`
> **Raw OpenAPI Spec:** `http://localhost:5000/api/docs/spec`

---

## 🚀 Khởi động Server

```bash
# 1. Cài dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Push schema lên database (nếu lần đầu)
npx prisma db push

# 4. Chạy server
npm run dev
```

**Biến môi trường cần thiết (`.env`):**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://<user>:<password>@<ep-pooler>.neon.tech/neondb?sslmode=require"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"
ENCRYPTION_KEY="32_byte_hex_string_key_for_aes_256"
GOOGLE_CLIENT_ID="<GCP_Client_ID>"
GOOGLE_CLIENT_SECRET="<GCP_Secret>"
SESSION_SECRET="session_secret_for_passport"
CLIENT_URL="http://localhost:3000"
SYNC_CRON_SCHEDULE="0 */6 * * *"
```

---

## 📌 Quy ước khi Test

| Ký hiệu | Ý nghĩa |
|------|---------|
| 🔓 | Không cần Auth |
| 🔐 | Cần Bearer Token |
| 👑 | ADMIN only |
| 📚 | LECTURER |
| ⭐ | LEADER |
| 👤 | MEMBER |

**Header chung cho tất cả request cần auth:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 🧪 PHASE 1–5: Health Check & Authentication

### 1.1 Health Check 🔓

```
GET /api/health
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Server is running 🚀",
  "database": "Neon PostgreSQL ✅",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### 1.2 Đăng ký tài khoản 🔓

```
POST /api/auth/register
```

Tạo lần lượt **4 tài khoản** để test đầy đủ RBAC:

#### Account 1: ADMIN
```json
{
  "full_name": "Admin User",
  "email": "admin@fpt.edu.vn",
  "password": "Admin@123",
  "github_username": "admin-github"
}
```

#### Account 2: LECTURER
```json
{
  "full_name": "Le Van Giang Vien",
  "email": "lecturer@fpt.edu.vn",
  "password": "Lecturer@123",
  "github_username": "lecturer-github"
}
```

#### Account 3: LEADER (Student)
```json
{
  "full_name": "Nguyen Van Leader",
  "email": "leader@fpt.edu.vn",
  "password": "Leader@123",
  "github_username": "leader-github"
}
```

#### Account 4: MEMBER (Student)
```json
{
  "full_name": "Tran Thi Member",
  "email": "member@fpt.edu.vn",
  "password": "Member@123",
  "github_username": "member-github"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Register successful!",
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": { "user_id": 1, "full_name": "Admin User", "email": "admin@fpt.edu.vn", "roles": ["MEMBER"] }
  }
}
```

> ⚠️ **Lưu ý:** Tài khoản mới tạo mặc định role `MEMBER`. Bạn cần gán role thủ công qua database hoặc API Admin.

---

### 1.3 Đăng nhập 🔓

```
POST /api/auth/login
```

```json
{
  "email": "admin@fpt.edu.vn",
  "password": "Admin@123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1...",  // ← LƯU TOKEN NÀY!
    "user": { ... }
  }
}
```

> 💡 **Lưu lại 4 token** tương ứng 4 tài khoản ADMIN, LECTURER, LEADER, MEMBER.

---

### 1.4 Gán Roles (ADMIN) 🔐👑

Trước khi test, cần gán đúng role cho từng user.

**Cách 1: Qua API Users** (nếu có endpoint)

**Cách 2: Qua SQL trực tiếp trên Neon Console:**
```sql
-- Xem danh sách roles
SELECT * FROM "Role";

-- Gán ADMIN role cho user_id=1
INSERT INTO "User_Role" (user_id, role_id) VALUES (1, 1) ON CONFLICT DO NOTHING;

-- Gán LECTURER role cho user_id=2
INSERT INTO "User_Role" (user_id, role_id) VALUES (2, 2) ON CONFLICT DO NOTHING;

-- Gán LEADER role cho user_id=3 (giữ MEMBER + thêm LEADER hoặc riêng)
-- (LEADER thường không ở bảng Role riêng, mà ở Group_Leader)

-- user_id=4 giữ MEMBER mặc định
```

> ⚠️ Nếu bảng `Role` chưa có dữ liệu, hãy seed trước:
> ```sql
> INSERT INTO "Role" (role_name) VALUES ('ADMIN'), ('LECTURER'), ('LEADER'), ('MEMBER')
> ON CONFLICT (role_name) DO NOTHING;
> ```

---

### 1.5 Google OAuth 🔓

```
GET /api/auth/google
```
→ Redirect đến Google Login → Callback → Trả JWT token.

> 🔧 Cần cấu hình `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `.env`.

---

## 🧪 PHASE 6: Group Management

### 6.1 Tạo nhóm (ADMIN) 🔐👑

```
POST /api/groups
```

```json
{
  "group_name": "SWP391-SE1234",
  "semester": "Fall2024",
  "project_title": "Jira & GitHub Management Tool"
}
```

**Expected (201):** Trả về object nhóm với `group_id`.

> 📝 **Lưu `group_id`** (ví dụ: `1`) để dùng cho tất cả API sau.

---

### 6.2 Xem danh sách nhóm 🔐

```
GET /api/groups
```

**Test RBAC:**
| Token | Expected |
|-------|----------|
| ADMIN | Xem tất cả nhóm |
| LECTURER | Chỉ nhóm được phân công |
| LEADER/MEMBER | Chỉ nhóm mình thuộc |

---

### 6.3 Thêm thành viên vào nhóm 🔐👑📚

```
POST /api/groups/1/members
```

```json
{ "user_id": 3 }  // Thêm Leader
```
```json
{ "user_id": 4 }  // Thêm Member
```

---

### 6.4 Gán Leader cho nhóm 🔐👑

> Tùy codebase, Leader có thể được gán qua bảng `Group_Leader`:

```sql
INSERT INTO "Group_Leader" (group_id, user_id) VALUES (1, 3);
```

Hoặc qua API nếu có endpoint.

---

### 6.5 Gán Lecturer cho nhóm (ADMIN) 🔐👑

```
POST /api/groups/1/lecturers
```

```json
{ "lecturer_id": 2 }
```

---

### 6.6 Test Data Scoping (BR-04) 🔐

| Action | Token | Expected |
|--------|-------|----------|
| `GET /api/groups/1/members` | MEMBER (thuộc nhóm 1) | ✅ 200 |
| `GET /api/groups/1/members` | MEMBER (KHÔNG thuộc nhóm 1) | ❌ 403 |
| `GET /api/groups/1/members` | LECTURER (phụ trách nhóm 1) | ✅ 200 |
| `GET /api/groups/1/members` | LECTURER (KHÔNG phụ trách nhóm 1) | ❌ 403 |
| `GET /api/groups/1/members` | ADMIN | ✅ 200 (bypass) |

---

## 🧪 PHASE 7: Jira Integration

### 7.1 Cấu hình Jira (LEADER/ADMIN) 🔐⭐👑

```
POST /api/groups/1/jira
```

```json
{
  "project_key": "SWP",
  "project_name": "SWP391 Project",
  "base_url": "https://your-domain.atlassian.net",
  "jira_email": "your-email@gmail.com",
  "jira_api_token": "your_jira_api_token_here"
}
```

**Expected (201):** Config được tạo, `jira_api_token` được encrypt.

**Verify BR-08 (Encryption):**
```sql
SELECT jira_api_token FROM "Jira_Project" WHERE group_id = 1;
-- Kết quả phải là chuỗi encrypted, KHÔNG phải plain text
```

---

### 7.2 Xem Config Jira 🔐

```
GET /api/groups/1/jira
```

**Expected:** Trả config KHÔNG chứa `jira_api_token` (hoặc masked).

---

### 7.3 Sync Issues từ Jira (LEADER/LECTURER/ADMIN) 🔐⭐📚👑

```
POST /api/groups/1/jira/sync
```

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "total_from_jira": 15,
    "created": 15,
    "updated": 0
  }
}
```

> ⚠️ Cần có Jira project thật với issues để test.

---

### 7.4 Xem Issues đã Sync 🔐

```
GET /api/groups/1/jira/issues
```

**Expected:** Danh sách issues đã sync từ Jira.

---

### 7.5 Cập nhật Status Issue (Flow 2) 🔐👤⭐

```
PUT /api/groups/1/jira/issues/:issueId/status
```

```json
{
  "status": "Done"
}
```

**Expected:** Status cập nhật ở cả DB nội bộ VÀ Jira (bidirectional - BR-09).

---

### 7.6 Gán Task cho Member (Flow 1) 🔐⭐👑

```
PUT /api/groups/1/jira/issues/:issueId/assign
```

```json
{
  "assignee_email": "member@fpt.edu.vn"
}
```

**Expected:** Assignee update ở DB VÀ sync lên Jira API.

**Test RBAC:**
| Token | Expected |
|-------|----------|
| LEADER (trong nhóm) | ✅ 200 |
| MEMBER | ❌ 403 |
| ADMIN | ✅ 200 |

---

## 🧪 PHASE 8: GitHub Integration

### 8.1 Cấu hình GitHub Repo (LEADER/ADMIN) 🔐⭐👑

```
POST /api/groups/1/github
```

```json
{
  "repo_name": "swd-be",
  "repo_url": "https://github.com/longdevlife/swd-be",
  "owner": "longdevlife",
  "github_pat": "ghp_your_github_personal_access_token"
}
```

**Expected (201):** Config được tạo, `github_pat` encrypted.

**Verify BR-08:**
```sql
SELECT github_pat FROM "Git_Repository" WHERE group_id = 1;
-- Phải là chuỗi encrypted
```

---

### 8.2 Xem Config GitHub 🔐

```
GET /api/groups/1/github
```

---

### 8.3 Sync Commits (LEADER/LECTURER/ADMIN) 🔐⭐📚👑

```
POST /api/groups/1/github/sync
```

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "total_from_github": 50,
    "created": 30,
    "skipped": 20,
    "linked_issues": 5
  }
}
```

> **Lưu ý quan trọng:**
> - `skipped`: Commits mà author không match với `github_username`/`email` của bất kỳ thành viên nào
> - `linked_issues`: Số commit được auto-link với Jira issues (Flow 4)
> - Commit message phải có format `SWP-123: description` để auto-link

---

### 8.4 Xem Commits đã Sync 🔐

```
GET /api/groups/1/github/commits
```

---

### 8.5 Thống kê Commits theo Member 🔐

```
GET /api/groups/1/github/commits/stats
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 3,
      "full_name": "Nguyen Van Leader",
      "total_commits": 25,
      "total_lines_added": 1500,
      "total_lines_deleted": 300
    }
  ]
}
```

---

## 🧪 PHASE 9: Contribution Reporting

### 9.1 Tạo/Tính lại Báo cáo (LEADER/LECTURER/ADMIN) 🔐⭐📚👑

```
POST /api/groups/1/reports/generate
```

**Expected (200):**
```json
{
  "success": true,
  "message": "Contribution reports generated successfully",
  "data": {
    "reports_count": 2,
    "reports": [
      {
        "report_id": 1,
        "user_id": 3,
        "total_commits": 25,
        "total_issues_resolved": 8,
        "total_lines_added": 1500,
        "total_lines_deleted": 300
      }
    ]
  }
}
```

---

### 9.2 Xem Báo cáo toàn nhóm 🔐

```
GET /api/groups/1/reports
```

---

### 9.3 Xem Báo cáo cá nhân 🔐

```
GET /api/groups/1/reports/me
```

**Test RBAC:**
| Token | Expected |
|-------|----------|
| MEMBER (thuộc nhóm 1) | ✅ Chỉ thấy report của mình |
| LECTURER (phụ trách) | ✅ Có thể thấy tất cả |
| ADMIN | ✅ Có thể thấy tất cả |

---

## 🧪 PHASE 10: Manual Sync & Cron Job

### 10.1 Manual Sync (Flow 3 hoàn chỉnh) 🔐⭐📚👑

```
POST /api/groups/1/sync
```

**Expected (200):**
```json
{
  "success": true,
  "message": "Sync completed",
  "data": {
    "group_id": 1,
    "jira": {
      "total_from_jira": 15,
      "created": 2,
      "updated": 13
    },
    "github": {
      "total_from_github": 5,
      "created": 3,
      "skipped": 2,
      "linked_issues": 2
    },
    "reports": {
      "members_processed": 2
    },
    "errors": []
  }
}
```

**Nếu có partial error → trả 207:**
```json
{
  "success": true,
  "message": "Sync completed with warnings",
  "data": {
    "jira": { "total_from_jira": 15, "created": 0, "updated": 15 },
    "github": null,
    "reports": { "members_processed": 2 },
    "errors": [{ "step": "github", "message": "Bad credentials" }]
  }
}
```

---

### 10.2 Test Cron Job

Cron job tự chạy theo schedule `SYNC_CRON_SCHEDULE` (mặc định `0 */6 * * *` = mỗi 6 giờ).

**Test thủ công:**

1. Đặt `SYNC_CRON_SCHEDULE="*/1 * * * *"` trong `.env` (chạy mỗi 1 phút)
2. Restart server
3. Quan sát console log:

```
🕐 Cron Jobs initialized. Schedule: */1 * * * *
⏰ Running scheduled sync...
🔄 Syncing group: SWP391-SE1234 (ID: 1)
✅ Group SWP391-SE1234: Jira={...}, GitHub={...}, Reports={...}
⏰ Sync completed at 2024-01-01T12:01:00.000Z
```

4. Sau khi test xong, đổi lại schedule gốc.

---

## 🔄 Full Flow Testing (E2E Scenarios)

### Scenario 1: Complete Setup → Sync → Report

```
1. ADMIN tạo group              → POST /api/groups
2. ADMIN thêm members           → POST /api/groups/1/members
3. ADMIN gán lecturer           → POST /api/groups/1/lecturers
4. LEADER config Jira           → POST /api/groups/1/jira
5. LEADER config GitHub         → POST /api/groups/1/github
6. LEADER trigger sync          → POST /api/groups/1/sync
7. Verify Jira issues synced    → GET  /api/groups/1/jira/issues
8. Verify commits synced        → GET  /api/groups/1/github/commits
9. Verify reports generated     → GET  /api/groups/1/reports
10. MEMBER xem report cá nhân   → GET  /api/groups/1/reports/me
```

### Scenario 2: Task Assignment Flow (Flow 1)

```
1. LEADER gán task cho member   → PUT /api/groups/1/jira/issues/:id/assign
2. Verify trên Jira             → Kiểm tra assignee trên Jira web
3. MEMBER xem task được gán     → GET /api/groups/1/jira/issues (filter by assignee)
```

### Scenario 3: Task Status Update (Flow 2)

```
1. MEMBER cập nhật status       → PUT /api/groups/1/jira/issues/:id/status
2. Verify DB updated            → GET /api/groups/1/jira/issues (check status)
3. Verify Jira updated          → Kiểm tra status trên Jira web
```

### Scenario 4: Auto-link Commit ↔ Jira Issue (Flow 4)

```
Tiền đề: Có Jira issue key "SWP-1" trong DB
1. Push commit lên GitHub với message "SWP-1: fix login bug"
2. Trigger sync                 → POST /api/groups/1/sync
3. Verify commit synced         → GET /api/groups/1/github/commits
4. Verify auto-link created     → Kiểm tra commit.commit_issues có link tới SWP-1
```

### Scenario 5: Incremental Sync

```
1. First sync                   → POST /api/groups/1/sync (sync tất cả commits)
2. Push thêm commits mới lên GitHub
3. Second sync                  → POST /api/groups/1/sync
4. Verify chỉ commits mới      → created > 0, skipped bao gồm commits cũ
```

---

## 🔒 RBAC Testing Matrix

### Endpoint Access Matrix

| Endpoint | ADMIN | LECTURER | LEADER | MEMBER |
|----------|-------|----------|--------|--------|
| `POST /groups` | ✅ | ❌ | ❌ | ❌ |
| `GET /groups` | ✅ all | ✅ assigned | ✅ own | ✅ own |
| `POST /groups/:id/members` | ✅ | ✅ | ❌ | ❌ |
| `POST /groups/:id/lecturers` | ✅ | ❌ | ❌ | ❌ |
| `POST /groups/:id/jira` (config) | ✅ | ❌ | ✅ | ❌ |
| `POST /groups/:id/jira/sync` | ✅ | ✅ | ✅ | ❌ |
| `GET /groups/:id/jira/issues` | ✅ | ✅ | ✅ | ✅ |
| `PUT /jira/issues/:id/status` | ✅ | ✅ | ✅ | ✅ |
| `PUT /jira/issues/:id/assign` | ✅ | ❌ | ✅ | ❌ |
| `POST /groups/:id/github` (config) | ✅ | ❌ | ✅ | ❌ |
| `POST /groups/:id/github/sync` | ✅ | ✅ | ✅ | ❌ |
| `GET /groups/:id/github/commits` | ✅ | ✅ | ✅ | ✅ |
| `GET /github/commits/stats` | ✅ | ✅ | ✅ | ✅ |
| `POST /groups/:id/reports/generate` | ✅ | ✅ | ✅ | ❌ |
| `GET /groups/:id/reports` | ✅ | ✅ | ✅ | ✅ |
| `GET /groups/:id/reports/me` | ✅ | ✅ | ✅ | ✅ |
| `POST /groups/:id/sync` | ✅ | ✅ | ✅ | ❌ |

---

## 🐛 Common Errors & Troubleshooting

### 1. "Not authorized. No token."
**Cause:** Thiếu header `Authorization: Bearer <token>`.
**Fix:** Thêm header hoặc login lại để lấy token mới.

### 2. "Requires one of: ADMIN, LEADER"
**Cause:** Token user không có role được phép.
**Fix:** Gán role đúng cho user (xem mục 1.4).

### 3. "You can only access data from your own group. (BR-04)"
**Cause:** User truy cập nhóm không thuộc quyền quản lý.
**Fix:** Dùng token của user thuộc nhóm đó, hoặc dùng ADMIN.

### 4. Jira Sync trả 401 "Unauthorized"
**Cause:** `jira_api_token` hoặc `jira_email` sai.
**Fix:** Tạo API token mới tại https://id.atlassian.com/manage/api-tokens

### 5. GitHub Sync trả "Bad credentials"
**Cause:** `github_pat` hết hạn hoặc không đủ permission.
**Fix:** Tạo PAT mới tại https://github.com/settings/tokens với scope `repo`.

### 6. Commits synced nhưng `linked_issues = 0`
**Cause:** Commit message không chứa Jira issue key hoặc Jira không được sync trước.
**Fix:** Đảm bảo commit message có format `SWP-123: message` và đã sync Jira issues trước.

### 7. Commits synced nhưng `created = 0, skipped = all`
**Cause:** Author GitHub không match `github_username` hoặc `email` của member nào.
**Fix:** Cập nhật `github_username` cho users trong DB cho đúng username GitHub.

---

## 📊 Database Verification Queries

Dùng trên Neon Console hoặc Prisma Studio (`npx prisma studio`):

```sql
-- Kiểm tra Jira config (token phải encrypted)
SELECT group_id, project_key, base_url, jira_email,
       LEFT(jira_api_token, 20) || '...' AS token_preview
FROM "Jira_Project";

-- Kiểm tra GitHub config (PAT phải encrypted)
SELECT group_id, repo_name, owner,
       LEFT(github_pat, 20) || '...' AS pat_preview
FROM "Git_Repository";

-- Kiểm tra issues synced
SELECT issue_key, summary, status, assignee_email
FROM "Jira_Issue"
ORDER BY created_at DESC LIMIT 10;

-- Kiểm tra commits synced
SELECT cr.commit_hash, cr.commit_message, u.full_name, cr.lines_added, cr.lines_deleted
FROM "Commit_Record" cr
JOIN "User" u ON cr.author_id = u.user_id
ORDER BY cr.committed_at DESC LIMIT 10;

-- Kiểm tra commit-issue links (Flow 4)
SELECT cr.commit_message, ji.issue_key
FROM "Commit_Issue" ci
JOIN "Commit_Record" cr ON ci.commit_id = cr.commit_id
JOIN "Jira_Issue" ji ON ci.jira_issue_id = ji.jira_issue_id;

-- Kiểm tra contribution reports
SELECT cr.report_id, u.full_name, cr.total_commits,
       cr.total_issues_resolved, cr.total_lines_added, cr.total_lines_deleted
FROM "Contribution_Report" cr
JOIN "User" u ON cr.user_id = u.user_id
WHERE cr.group_id = 1;
```

---

## ✅ Checklist Tổng Kết

- [ ] Health check thành công
- [ ] Đăng ký 4 accounts (ADMIN, LECTURER, LEADER, MEMBER)
- [ ] Đăng nhập thành công, lưu 4 tokens
- [ ] Gán roles đúng
- [ ] Tạo nhóm (ADMIN)
- [ ] Thêm members vào nhóm
- [ ] Gán lecturer vào nhóm
- [ ] Gán leader cho nhóm
- [ ] Config Jira (LEADER) → verify token encrypted
- [ ] Sync Jira issues thành công
- [ ] Xem Jira issues
- [ ] Update issue status (Flow 2) → verify trên Jira
- [ ] Assign task (Flow 1) → verify trên Jira
- [ ] Config GitHub (LEADER) → verify PAT encrypted
- [ ] Sync commits thành công
- [ ] Verify auto-link commit ↔ Jira issue (Flow 4)
- [ ] Xem commits & stats
- [ ] Generate contribution reports
- [ ] Xem report nhóm & cá nhân
- [ ] Manual Sync (Flow 3 hoàn chỉnh)
- [ ] Cron Job hoạt động (check logs)
- [ ] Test RBAC: MEMBER bị chặn trên endpoint LEADER-only
- [ ] Test Data Scoping (BR-04): User nhóm khác bị 403
- [ ] Test credential encryption (BR-08): Token/PAT encrypted trong DB
