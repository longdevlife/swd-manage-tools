// ══════════════════════════════════════════════════════════
// Unified Sync Service
// Phase 10 – Orchestrates: Jira Sync → GitHub Sync → Report Generation
// Tái sử dụng bởi cả Manual Sync endpoint và Cron Job
// ══════════════════════════════════════════════════════════
import prisma from "../config/db.js";
import JiraAdapter from "./jiraAdapter.js";
import GitHubAdapter from "./githubAdapter.js";
import { decrypt } from "../utils/encryption.js";
import { matchCommitAuthorToMember } from "../utils/githubAuthorMatcher.js";

const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/gi;

/**
 * Sync đầy đủ cho 1 nhóm: Flow 3 hoàn chỉnh
 * Jira → GitHub → Commit↔Issue Linking → Contribution Report
 * @param {number} groupId
 * @returns {Object} Kết quả sync tổng hợp
 */
export const syncGroup = async (groupId) => {
  const results = {
    group_id: groupId,
    jira: null,
    github: null,
    reports: null,
    errors: [],
  };

  // ═══════════════════════════════════════════════════
  // Step 1: Sync Jira Issues
  // ═══════════════════════════════════════════════════
  try {
    const jiraConfig = await prisma.jira_Project.findUnique({
      where: { group_id: groupId },
    });

    if (jiraConfig) {
      const decryptedToken = decrypt(jiraConfig.jira_api_token);
      const jiraAdapter = new JiraAdapter(
        jiraConfig.base_url,
        jiraConfig.jira_email,
        decryptedToken,
      );

      const jiraIssues = await jiraAdapter.getAllIssues(jiraConfig.project_key);

      let jiraCreated = 0;
      let jiraUpdated = 0;

      for (const issue of jiraIssues) {
        const issueData = {
          jira_project_id: jiraConfig.jira_project_id,
          issue_key: issue.key,
          issue_type: issue.fields.issuetype?.name || "Task",
          summary: issue.fields.summary || "",
          status: issue.fields.status?.name || "To Do",
          priority: issue.fields.priority?.name || null,
          assignee_email: issue.fields.assignee?.emailAddress || null,
          created_at: new Date(issue.fields.created),
        };

        const existing = await prisma.jira_Issue.findFirst({
          where: {
            jira_project_id: jiraConfig.jira_project_id,
            issue_key: issue.key,
          },
        });

        if (existing) {
          await prisma.jira_Issue.update({
            where: { jira_issue_id: existing.jira_issue_id },
            data: issueData,
          });
          jiraUpdated++;
        } else {
          await prisma.jira_Issue.create({ data: issueData });
          jiraCreated++;
        }
      }

      results.jira = {
        total_from_jira: jiraIssues.length,
        created: jiraCreated,
        updated: jiraUpdated,
      };
    } else {
      results.jira = { skipped: true, reason: "Jira not configured" };
    }
  } catch (error) {
    results.errors.push({ step: "jira", message: error.message });
  }

  // ═══════════════════════════════════════════════════
  // Step 2: Sync GitHub Commits + Flow 4 (Auto-link)
  // ═══════════════════════════════════════════════════
  try {
    const gitConfig = await prisma.git_Repository.findUnique({
      where: { group_id: groupId },
    });

    if (gitConfig) {
      const decryptedPat = decrypt(gitConfig.github_pat);
      const githubAdapter = new GitHubAdapter(gitConfig.owner, gitConfig.repo_name, decryptedPat);

      // Incremental sync
      const latestCommit = await prisma.commit_Record.findFirst({
        where: { repo_id: gitConfig.repo_id },
        orderBy: { committed_at: "desc" },
      });

      const since = latestCommit ? new Date(latestCommit.committed_at).toISOString() : null;

      const githubCommits = await githubAdapter.getAllCommits(since);

      let ghCreated = 0;
      let ghSkipped = 0;
      let ghUnmatched = 0;
      let linkedIssues = 0;

      // Lấy members để match author
      const members = await prisma.group_Member.findMany({
        where: { group_id: groupId },
        include: {
          user: {
            select: { user_id: true, email: true, github_username: true },
          },
        },
      });

      // Lấy Jira issues cho Flow 4
      const jiraProject = await prisma.jira_Project.findUnique({
        where: { group_id: groupId },
        include: { jira_issues: true },
      });

      for (const commit of githubCommits) {
        const sha = commit.sha;

        // Skip nếu đã tồn tại
        const exists = await prisma.commit_Record.findUnique({
          where: { commit_hash: sha },
        });
        if (exists) {
          ghSkipped++;
          continue;
        }

        const match = matchCommitAuthorToMember(commit, members);
        const matchedMember = match.member;

        // Lấy commit detail (stats)
        let stats = { additions: 0, deletions: 0 };
        try {
          const detail = await githubAdapter.getCommitDetail(sha);
          stats = detail.stats || stats;
        } catch {
          // Ignore stats error
        }

        // Tạo commit record
        const commitRecord = await prisma.commit_Record.create({
          data: {
            repo_id: gitConfig.repo_id,
            author_id: matchedMember?.user?.user_id || null,
            author_login: match.metadata.authorLogin,
            author_email: match.metadata.authorEmail,
            author_name: match.metadata.authorName,
            match_status: match.match_status,
            match_reason: match.match_reason,
            commit_hash: sha,
            commit_message: (commit.commit?.message || "").slice(0, 500),
            committed_at: new Date(commit.commit?.author?.date || commit.commit?.committer?.date),
            lines_added: stats.additions || 0,
            lines_deleted: stats.deletions || 0,
          },
        });
        ghCreated++;

        if (!matchedMember) {
          ghUnmatched++;
        }

        // Flow 4: Auto-link Commit ↔ Jira Issue
        if (jiraProject && jiraProject.jira_issues.length > 0) {
          const matches = commitRecord.commit_message?.match(ISSUE_KEY_PATTERN);

          if (matches) {
            for (const issueKeyRaw of matches) {
              const issueKey = issueKeyRaw.toUpperCase();
              const jiraIssue = jiraProject.jira_issues.find(
                (ji) => ji.issue_key.toUpperCase() === issueKey,
              );

              if (jiraIssue) {
                const existingLink = await prisma.commit_Issue.findUnique({
                  where: {
                    commit_id_jira_issue_id: {
                      commit_id: commitRecord.commit_id,
                      jira_issue_id: jiraIssue.jira_issue_id,
                    },
                  },
                });

                if (!existingLink) {
                  await prisma.commit_Issue.create({
                    data: {
                      commit_id: commitRecord.commit_id,
                      jira_issue_id: jiraIssue.jira_issue_id,
                    },
                  });
                  linkedIssues++;
                }
              }
            }
          }
        }
      }

      results.github = {
        total_from_github: githubCommits.length,
        created: ghCreated,
        skipped: ghSkipped,
        unmatched: ghUnmatched,
        linked_issues: linkedIssues,
      };
    } else {
      results.github = { skipped: true, reason: "GitHub not configured" };
    }
  } catch (error) {
    results.errors.push({ step: "github", message: error.message });
  }

  // ═══════════════════════════════════════════════════
  // Step 3: Generate Contribution Reports
  // ═══════════════════════════════════════════════════
  try {
    const group = await prisma.student_Group.findUnique({
      where: { group_id: groupId },
      include: { group_members: { select: { user_id: true } } },
    });

    if (group && group.group_members.length > 0) {
      const memberIds = group.group_members.map((m) => m.user_id);
      const gitConfig = await prisma.git_Repository.findUnique({
        where: { group_id: groupId },
      });
      const jiraConfig = await prisma.jira_Project.findUnique({
        where: { group_id: groupId },
      });

      let reportCount = 0;

      for (const userId of memberIds) {
        // GitHub stats
        let totalCommits = 0,
          totalLinesAdded = 0,
          totalLinesDeleted = 0;

        if (gitConfig) {
          const commitStats = await prisma.commit_Record.aggregate({
            where: { repo_id: gitConfig.repo_id, author_id: userId },
            _count: { commit_id: true },
            _sum: { lines_added: true, lines_deleted: true },
          });
          totalCommits = commitStats._count.commit_id || 0;
          totalLinesAdded = commitStats._sum.lines_added || 0;
          totalLinesDeleted = commitStats._sum.lines_deleted || 0;
        }

        // Jira issues resolved
        let totalIssuesResolved = 0;
        if (jiraConfig) {
          const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: { email: true },
          });
          if (user) {
            totalIssuesResolved = await prisma.jira_Issue.count({
              where: {
                jira_project_id: jiraConfig.jira_project_id,
                assignee_email: { equals: user.email, mode: "insensitive" },
                status: {
                  in: ["Done", "Closed", "Resolved", "done", "closed", "resolved"],
                },
              },
            });
          }
        }

        // Upsert report
        const existingReport = await prisma.contribution_Report.findFirst({
          where: { group_id: groupId, user_id: userId },
        });

        if (existingReport) {
          await prisma.contribution_Report.update({
            where: { report_id: existingReport.report_id },
            data: {
              total_commits: totalCommits,
              total_issues_resolved: totalIssuesResolved,
              total_lines_added: totalLinesAdded,
              total_lines_deleted: totalLinesDeleted,
              calculated_at: new Date(),
            },
          });
        } else {
          await prisma.contribution_Report.create({
            data: {
              group_id: groupId,
              user_id: userId,
              total_commits: totalCommits,
              total_issues_resolved: totalIssuesResolved,
              total_lines_added: totalLinesAdded,
              total_lines_deleted: totalLinesDeleted,
            },
          });
        }
        reportCount++;
      }

      results.reports = { members_processed: reportCount };
    } else {
      results.reports = { skipped: true, reason: "No group members" };
    }
  } catch (error) {
    results.errors.push({ step: "reports", message: error.message });
  }

  return results;
};

/**
 * Sync tất cả nhóm đã config (cho Cron Job)
 * @returns {Array} Kết quả sync của từng nhóm
 */
export const syncAllGroups = async () => {
  // Lấy tất cả nhóm đã cấu hình ít nhất 1 trong 2 (Jira hoặc GitHub)
  const groups = await prisma.student_Group.findMany({
    where: {
      OR: [{ jira_project: { isNot: null } }, { git_repository: { isNot: null } }],
    },
    select: { group_id: true, group_name: true },
  });

  const allResults = [];

  for (const group of groups) {
    console.log(`🔄 Syncing group: ${group.group_name} (ID: ${group.group_id})`);
    const result = await syncGroup(group.group_id);
    allResults.push({ group_name: group.group_name, ...result });
    console.log(
      `✅ Group ${group.group_name}: Jira=${JSON.stringify(result.jira)}, GitHub=${JSON.stringify(result.github)}, Reports=${JSON.stringify(result.reports)}`,
    );
  }

  return allResults;
};
