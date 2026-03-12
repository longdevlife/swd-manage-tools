// ══════════════════════════════════════════════════════════
// GitHub Integration – OpenAPI Documentation (Scalar)
// ══════════════════════════════════════════════════════════

/**
 * @openapi
 * tags:
 *   - name: GitHub
 *     description: GitHub repository configuration, commit synchronization & statistics
 */

/**
 * @openapi
 * /api/groups/{groupId}/github:
 *   get:
 *     tags: [GitHub]
 *     summary: Get GitHub repo configuration
 *     description: Returns the GitHub repository configuration for a group. Does NOT return the PAT (BR-08).
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
 *         description: GitHub config (or null if not configured)
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
 *                     repo_id:
 *                       type: integer
 *                     group_id:
 *                       type: integer
 *                     repo_name:
 *                       type: string
 *                     repo_url:
 *                       type: string
 *                     owner:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not in this group
 */

/**
 * @openapi
 * /api/groups/{groupId}/github:
 *   post:
 *     tags: [GitHub]
 *     summary: Configure GitHub repository
 *     description: Set up GitHub repo connection for a group. Tests connection before saving. PAT is encrypted (BR-08). Only LEADER/ADMIN.
 *     security:
 *       - bearerAuth: []
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
 *             required: [repo_name, repo_url, owner, github_pat]
 *             properties:
 *               repo_name:
 *                 type: string
 *                 example: "swd-be"
 *               repo_url:
 *                 type: string
 *                 example: "https://github.com/longdevlife/swd-be"
 *               owner:
 *                 type: string
 *                 example: "longdevlife"
 *               github_pat:
 *                 type: string
 *                 example: "ghp_xxxxxxxxxxxx"
 *     responses:
 *       201:
 *         description: GitHub repo configured successfully
 *       400:
 *         description: Bad request – missing fields or connection failed
 *       403:
 *         description: Forbidden – not LEADER/ADMIN
 *       404:
 *         description: Group not found
 */

/**
 * @openapi
 * /api/groups/{groupId}/github/sync:
 *   post:
 *     tags: [GitHub]
 *     summary: Sync commits from GitHub
 *     description: |
 *       Fetches all commits from GitHub API, creates Commit_Record entries, and auto-links commits to Jira issues (Flow 4).
 *       Commit messages are parsed with regex `/[A-Z]+-\d+/` to find Jira issue keys.
 *       Only LEADER, LECTURER, ADMIN can trigger sync.
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
 *         description: Sync completed
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
 *                     total_from_github:
 *                       type: integer
 *                     created:
 *                       type: integer
 *                     skipped:
 *                       type: integer
 *                     linked_issues:
 *                       type: integer
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Git repository not configured
 */

/**
 * @openapi
 * /api/groups/{groupId}/github/commits:
 *   get:
 *     tags: [GitHub]
 *     summary: List synced commits
 *     description: Returns all synced commits from the local database, including author info and linked Jira issues.
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
 *         description: List of commits
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
 *                       commit_id:
 *                         type: integer
 *                       commit_hash:
 *                         type: string
 *                       commit_message:
 *                         type: string
 *                       committed_at:
 *                         type: string
 *                         format: date-time
 *                       lines_added:
 *                         type: integer
 *                       lines_deleted:
 *                         type: integer
 *                       author:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: integer
 *                           full_name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       commit_issues:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             jira_issue:
 *                               type: object
 *                               properties:
 *                                 issue_key:
 *                                   type: string
 *                                 summary:
 *                                   type: string
 *       404:
 *         description: Git repository not configured
 */

/**
 * @openapi
 * /api/groups/{groupId}/github/commits/stats:
 *   get:
 *     tags: [GitHub]
 *     summary: Get commit statistics per member
 *     description: Returns aggregated commit statistics (total commits, lines added, lines deleted) for each group member.
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
 *         description: Commit stats per member
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
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
 *                       total_lines_added:
 *                         type: integer
 *                       total_lines_deleted:
 *                         type: integer
 *       404:
 *         description: Git repository not configured
 */
