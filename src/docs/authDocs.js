// ═══════════════════════════════════════════════════
// JSDoc OpenAPI annotations cho các route đã có
// File này được swagger-jsdoc scan tự động
// ═══════════════════════════════════════════════════

// ──────────────── HEALTH ──────────────────────────

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Kiem tra trang thai server va database
 *     description: Tra ve thong tin server dang chay va ket noi Neon PostgreSQL co OK khong.
 *     responses:
 *       200:
 *         description: Server hoat dong binh thuong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/HealthResponse"
 *       500:
 *         description: Loi ket noi Database
 */

// ──────────────── AUTH ────────────────────────────

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Dang ky tai khoan moi
 *     description: Tao tai khoan bang email va password. Mac dinh role la MEMBER.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "a@fpt.edu.vn"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "123456"
 *               role_name:
 *                 type: string
 *                 example: "MEMBER"
 *                 description: "Tuy chon - ADMIN, LECTURER, LEADER, MEMBER"
 *     responses:
 *       201:
 *         description: Dang ky thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       400:
 *         description: Email da ton tai
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Dang nhap bang email va password
 *     description: Tra ve JWT token va thong tin user neu xac thuc thanh cong.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "a@fpt.edu.vn"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Dang nhap thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       401:
 *         description: Sai email hoac password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Lay thong tin nguoi dung hien tai
 *     description: "Yeu cau JWT token trong header Authorization: Bearer token"
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thong tin user bao gom roles va groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: "#/components/schemas/UserResponse"
 *       401:
 *         description: Token khong hop le hoac het han
 */

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Dang nhap bang Google OAuth
 *     description: "Redirect nguoi dung sang trang dang nhap Google. Sau khi dang nhap, Google redirect ve /api/auth/google/callback. Luu y - Endpoint nay khong the test tren Scalar, hay mo tren trinh duyet."
 *     responses:
 *       302:
 *         description: Redirect sang Google login
 */

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback tu Google OAuth
 *     description: "Google redirect ve day sau khi user cho phep. Server tao JWT va redirect ve frontend kem token."
 *     responses:
 *       302:
 *         description: Redirect ve frontend voi token
 */
