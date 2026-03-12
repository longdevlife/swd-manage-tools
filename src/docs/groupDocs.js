// ═══════════════════════════════════════════════════
// JSDoc OpenAPI annotations cho Group Management APIs
// ═══════════════════════════════════════════════════

// ──────────────── GROUPS ──────────────────────────

/**
 * @openapi
 * /api/groups:
 *   get:
 *     tags: [Groups]
 *     summary: Lay danh sach nhom sinh vien
 *     description: "ADMIN: tat ca nhom. LECTURER: nhom duoc phan cong. LEADER/MEMBER: nhom cua minh."
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach nhom
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Chua dang nhap
 */

/**
 * @openapi
 * /api/groups:
 *   post:
 *     tags: [Groups]
 *     summary: Tao nhom sinh vien moi (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - group_name
 *               - semester
 *               - project_title
 *             properties:
 *               group_name:
 *                 type: string
 *                 example: "SE1856-NET-Team01"
 *               semester:
 *                 type: string
 *                 example: "Fall2024"
 *               project_title:
 *                 type: string
 *                 example: "SWP391 Project Management Tool"
 *     responses:
 *       201:
 *         description: Tao nhom thanh cong
 *       400:
 *         description: Thieu thong tin bat buoc
 *       403:
 *         description: Khong co quyen ADMIN
 */

/**
 * @openapi
 * /api/groups/{groupId}:
 *   get:
 *     tags: [Groups]
 *     summary: Xem chi tiet nhom
 *     description: Xem thong tin nhom bao gom members, leader, lecturers, Jira, GitHub config.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Chi tiet nhom
 *       403:
 *         description: Khong thuoc nhom nay (BR-04)
 *       404:
 *         description: Nhom khong ton tai
 */

/**
 * @openapi
 * /api/groups/{groupId}:
 *   put:
 *     tags: [Groups]
 *     summary: Cap nhat thong tin nhom (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_name:
 *                 type: string
 *               semester:
 *                 type: string
 *               project_title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cap nhat thanh cong
 *       403:
 *         description: Khong co quyen ADMIN
 *       404:
 *         description: Nhom khong ton tai
 */

/**
 * @openapi
 * /api/groups/{groupId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Xoa nhom (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoa thanh cong
 *       403:
 *         description: Khong co quyen ADMIN
 *       404:
 *         description: Nhom khong ton tai
 */

// ──────────────── MEMBERS ─────────────────────────

/**
 * @openapi
 * /api/groups/{groupId}/members:
 *   get:
 *     tags: [Groups]
 *     summary: Lay danh sach thanh vien trong nhom
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sach thanh vien
 *       403:
 *         description: Khong thuoc nhom nay
 */

/**
 * @openapi
 * /api/groups/{groupId}/members:
 *   post:
 *     tags: [Groups]
 *     summary: Them sinh vien vao nhom (ADMIN/LECTURER)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Them thanh vien thanh cong
 *       400:
 *         description: User da la thanh vien
 *       403:
 *         description: Khong co quyen
 *       404:
 *         description: Group hoac User khong ton tai
 */

/**
 * @openapi
 * /api/groups/{groupId}/members/{userId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Xoa sinh vien khoi nhom (ADMIN/LECTURER)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoa thanh vien thanh cong
 *       403:
 *         description: Khong co quyen
 *       404:
 *         description: Thanh vien khong ton tai trong nhom
 */

// ──────────────── LEADER ──────────────────────────

/**
 * @openapi
 * /api/groups/{groupId}/members/leader:
 *   get:
 *     tags: [Groups]
 *     summary: Xem nhom truong hien tai
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thong tin nhom truong (hoac null neu chua co)
 */

/**
 * @openapi
 * /api/groups/{groupId}/members/leader:
 *   put:
 *     tags: [Groups]
 *     summary: Chi dinh nhom truong (ADMIN/LECTURER)
 *     description: User phai la thanh vien cua nhom truoc khi duoc chi dinh lam leader.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Chi dinh leader thanh cong
 *       400:
 *         description: User chua la thanh vien cua nhom
 */

// ──────────────── LECTURERS ───────────────────────

/**
 * @openapi
 * /api/groups/{groupId}/lecturers:
 *   get:
 *     tags: [Groups]
 *     summary: Xem giang vien phu trach nhom (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sach giang vien
 */

/**
 * @openapi
 * /api/groups/{groupId}/lecturers:
 *   post:
 *     tags: [Groups]
 *     summary: Phan cong giang vien cho nhom (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lecturer_id
 *             properties:
 *               lecturer_id:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: Phan cong thanh cong
 *       400:
 *         description: User khong co role LECTURER hoac da phan cong roi
 *       404:
 *         description: Group hoac Lecturer khong ton tai
 */

/**
 * @openapi
 * /api/groups/{groupId}/lecturers/{lecturerId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Go giang vien khoi nhom (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: lecturerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Go giang vien thanh cong
 *       404:
 *         description: Khong tim thay phan cong
 */
