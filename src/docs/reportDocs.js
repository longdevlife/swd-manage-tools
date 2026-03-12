// ══════════════════════════════════════════════════════════
// Contribution Report – OpenAPI Documentation (Scalar)
// ══════════════════════════════════════════════════════════

/**
 * @openapi
 * tags:
 *   - name: Reports
 *     description: Contribution reports – aggregated data from Jira issues & GitHub commits
 */

/**
 * @openapi
 * /api/groups/{groupId}/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Get contribution reports for all group members
 *     description: |
 *       Returns aggregated contribution data per member, including total commits, lines of code,
 *       resolved Jira issues, and contribution percentages relative to the group total.
 *       Must trigger POST /reports/generate first to populate reports.
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
 *         description: List of contribution reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_group_commits:
 *                       type: integer
 *                     total_group_lines:
 *                       type: integer
 *                     total_group_issues_resolved:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       report_id:
 *                         type: integer
 *                       user:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: integer
 *                           full_name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           github_username:
 *                             type: string
 *                       total_commits:
 *                         type: integer
 *                       total_issues_resolved:
 *                         type: integer
 *                       total_lines_added:
 *                         type: integer
 *                       total_lines_deleted:
 *                         type: integer
 *                       calculated_at:
 *                         type: string
 *                         format: date-time
 *                       contribution_percentage:
 *                         type: object
 *                         properties:
 *                           commits:
 *                             type: number
 *                             description: "Percentage of total group commits"
 *                           lines:
 *                             type: number
 *                             description: "Percentage of total group lines changed"
 *                           issues:
 *                             type: number
 *                             description: "Percentage of total group issues resolved"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not in this group
 */

/**
 * @openapi
 * /api/groups/{groupId}/reports/generate:
 *   post:
 *     tags: [Reports]
 *     summary: Generate / recalculate contribution reports
 *     description: |
 *       Aggregates data from Commit_Record (GitHub) and Jira_Issue tables to calculate contribution metrics
 *       for every group member. Creates or updates Contribution_Report records.
 *       Only LEADER, LECTURER, ADMIN can trigger this.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reports generated successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       report_id:
 *                         type: integer
 *                       group_id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       total_commits:
 *                         type: integer
 *                       total_issues_resolved:
 *                         type: integer
 *                       total_lines_added:
 *                         type: integer
 *                       total_lines_deleted:
 *                         type: integer
 *                       calculated_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Group has no members
 *       403:
 *         description: Forbidden – not LEADER/LECTURER/ADMIN
 *       404:
 *         description: Group not found
 */

/**
 * @openapi
 * /api/groups/{groupId}/reports/me:
 *   get:
 *     tags: [Reports]
 *     summary: Get personal contribution report
 *     description: |
 *       Returns the contribution report for the currently authenticated user within the specified group.
 *       Includes contribution percentages and group summary totals for context.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Personal contribution report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     report_id:
 *                       type: integer
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: integer
 *                         full_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         github_username:
 *                           type: string
 *                     total_commits:
 *                       type: integer
 *                     total_issues_resolved:
 *                       type: integer
 *                     total_lines_added:
 *                       type: integer
 *                     total_lines_deleted:
 *                       type: integer
 *                     calculated_at:
 *                       type: string
 *                       format: date-time
 *                     contribution_percentage:
 *                       type: object
 *                       properties:
 *                         commits:
 *                           type: number
 *                         lines:
 *                           type: number
 *                         issues:
 *                           type: number
 *                     group_summary:
 *                       type: object
 *                       properties:
 *                         total_group_commits:
 *                           type: integer
 *                         total_group_lines:
 *                           type: integer
 *                         total_group_issues_resolved:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not in this group
 */
