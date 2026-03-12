// ═══════════════════════════════════════════════════
// JSDoc OpenAPI annotations cho Jira Integration APIs
// ═══════════════════════════════════════════════════

/**
 * @openapi
 * /api/groups/{groupId}/jira:
 *   get:
 *     tags: [Jira]
 *     summary: Xem cau hinh Jira cua nhom
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
 *         description: Cau hinh Jira (khong tra ve API token)
 */

/**
 * @openapi
 * /api/groups/{groupId}/jira:
 *   post:
 *     tags: [Jira]
 *     summary: Cau hinh Jira project cho nhom (LEADER/ADMIN)
 *     description: "Test ket noi truoc khi luu. API token duoc ma hoa AES-256 truoc khi luu vao DB."
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
 *               - project_key
 *               - base_url
 *               - jira_email
 *               - jira_api_token
 *             properties:
 *               project_key:
 *                 type: string
 *                 example: "SWP"
 *               project_name:
 *                 type: string
 *                 example: "SWP391 Project"
 *               base_url:
 *                 type: string
 *                 example: "https://yourteam.atlassian.net"
 *               jira_email:
 *                 type: string
 *                 example: "leader@fpt.edu.vn"
 *               jira_api_token:
 *                 type: string
 *                 example: "ATATT3xFfGF0..."
 *     responses:
 *       201:
 *         description: Cau hinh thanh cong (da test ket noi)
 *       400:
 *         description: Ket noi Jira that bai hoac thieu thong tin
 *       403:
 *         description: Khong co quyen
 */

/**
 * @openapi
 * /api/groups/{groupId}/jira/sync:
 *   post:
 *     tags: [Jira]
 *     summary: Dong bo issues tu Jira ve DB (LEADER/LECTURER/ADMIN)
 *     description: "Keo tat ca issues tu Jira project, upsert vao bang Jira_Issue."
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
 *         description: Ket qua dong bo (so luong created/updated)
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
 *                   properties:
 *                     total_from_jira:
 *                       type: integer
 *                     created:
 *                       type: integer
 *                     updated:
 *                       type: integer
 *       404:
 *         description: Chua cau hinh Jira
 */

/**
 * @openapi
 * /api/groups/{groupId}/jira/issues:
 *   get:
 *     tags: [Jira]
 *     summary: Lay danh sach issues da dong bo
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
 *         description: Danh sach Jira issues trong DB
 *       404:
 *         description: Chua cau hinh Jira
 */

/**
 * @openapi
 * /api/groups/{groupId}/jira/issues/{issueId}/status:
 *   put:
 *     tags: [Jira]
 *     summary: Cap nhat trang thai issue (Web -> Jira)
 *     description: "Member bam 'Hoan thanh' tren Web, Backend goi Jira Transitions API de chuyen trang thai."
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "jira_issue_id trong DB noi bo (khong phai Jira key)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: "Done"
 *                 description: "Ten trang thai ich tren Jira (To Do, In Progress, Done...)"
 *     responses:
 *       200:
 *         description: Cap nhat thanh cong (ca DB va Jira)
 *       400:
 *         description: Transition khong hop le tren Jira
 *       404:
 *         description: Issue khong ton tai
 */

/**
 * @openapi
 * /api/groups/{groupId}/jira/issues/{issueId}/assign:
 *   put:
 *     tags: [Jira]
 *     summary: Gan task cho member (LEADER/ADMIN -> Jira)
 *     description: "Leader chon member tren Web UI. Backend luu assignee vao DB noi bo, dong thoi goi Jira API de sync assignee len Jira."
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "jira_issue_id trong DB noi bo"
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
 *                 description: "user_id cua member trong nhom"
 *     responses:
 *       200:
 *         description: Gan task thanh cong (da sync len Jira)
 *       400:
 *         description: User khong phai member cua nhom
 *       403:
 *         description: Khong co quyen LEADER/ADMIN
 *       404:
 *         description: Issue khong ton tai
 */
