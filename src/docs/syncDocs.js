// ══════════════════════════════════════════════════════════
// Sync – OpenAPI Documentation (Scalar)
// ══════════════════════════════════════════════════════════

/**
 * @openapi
 * tags:
 *   - name: Sync
 *     description: Manual & automated sync – Jira issues, GitHub commits, and contribution reports
 */

/**
 * @openapi
 * /api/groups/{groupId}/sync:
 *   post:
 *     tags: [Sync]
 *     summary: Manual full sync (Jira + GitHub + Reports)
 *     description: |
 *       Triggers a complete sync for the specified group (Flow 3):
 *       1. Sync all Jira issues from the configured Jira project
 *       2. Sync all GitHub commits from the configured repository (incremental)
 *       3. Auto-link commits to Jira issues via commit message parsing (Flow 4)
 *       4. Recalculate Contribution Reports for all group members
 *
 *       Only LEADER, LECTURER, and ADMIN can trigger this.
 *       Returns 207 (Multi-Status) if some steps had errors but others succeeded.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Full sync completed successfully
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
 *                     group_id:
 *                       type: integer
 *                     jira:
 *                       type: object
 *                       properties:
 *                         total_from_jira:
 *                           type: integer
 *                         created:
 *                           type: integer
 *                         updated:
 *                           type: integer
 *                     github:
 *                       type: object
 *                       properties:
 *                         total_from_github:
 *                           type: integer
 *                         created:
 *                           type: integer
 *                         skipped:
 *                           type: integer
 *                         linked_issues:
 *                           type: integer
 *                     reports:
 *                       type: object
 *                       properties:
 *                         members_processed:
 *                           type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           step:
 *                             type: string
 *                             enum: [jira, github, reports]
 *                           message:
 *                             type: string
 *       207:
 *         description: Sync completed with partial errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not LEADER/LECTURER/ADMIN or not in group
 */
