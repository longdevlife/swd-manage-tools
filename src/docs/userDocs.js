// ═══════════════════════════════════════════════════
// JSDoc OpenAPI annotations cho User Management APIs
// ═══════════════════════════════════════════════════

// ──────────────── USERS ───────────────────────────

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Tao nguoi dung moi (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "12345678"
 *               role_name:
 *                 type: string
 *                 example: MEMBER
 *                 description: "Mac dinh MEMBER neu khong truyen"
 *     responses:
 *       201:
 *         description: Tao nguoi dung thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Email da ton tai hoac thieu truong bat buoc
 *       401:
 *         description: Chua dang nhap
 *       403:
 *         description: Khong co quyen
 */

/**
 * @openapi
 * /api/users/{id}/deactivate:
 *   patch:
 *     tags: [Users]
 *     summary: Vo hieu hoa tai khoan user - soft delete (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Vo hieu hoa thanh cong (is_active = false)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Khong the vo hieu hoa chinh minh
 *       404:
 *         description: Khong tim thay user
 *       401:
 *         description: Chua dang nhap
 *       403:
 *         description: Khong co quyen
 */

/**
 * @openapi
 * /api/users/{id}/roles:
 *   put:
 *     tags: [Users]
 *     summary: Cap nhat toan bo roles cua user (ADMIN, replace-all)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roles]
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ADMIN", "LECTURER"]
 *     responses:
 *       200:
 *         description: Cap nhat roles thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: roles phai la mang khong rong hoac ten role khong hop le
 *       404:
 *         description: Khong tim thay user
 *       401:
 *         description: Chua dang nhap
 *       403:
 *         description: Khong co quyen
 */

// ──────────────── ROLES ───────────────────────────

/**
 * @openapi
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Lay danh sach tat ca roles (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach roles
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
 *                     properties:
 *                       role_id:
 *                         type: integer
 *                       role_name:
 *                         type: string
 *       401:
 *         description: Chua dang nhap
 *       403:
 *         description: Khong co quyen
 */
