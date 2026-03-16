// Jira Controller – Config, Sync, Issues Management
import prisma from "../config/db.js";
import JiraAdapter from "../services/jiraAdapter.js";
import { encrypt, decrypt } from "../utils/encryption.js";

// ── Helper: Tạo JiraAdapter từ DB config ─────────────
const getAdapter = async (groupId) => {
  const config = await prisma.jira_Project.findUnique({
    where: { group_id: groupId },
  });
  if (!config) {
    const err = new Error("Jira project not configured for this group");
    err.statusCode = 404;
    throw err;
  }

  const decryptedToken = decrypt(config.jira_api_token);
  return { adapter: new JiraAdapter(config.base_url, config.jira_email, decryptedToken), config };
};

const getGroupJiraConfig = async (groupId) => {
  return prisma.jira_Project.findUnique({
    where: { group_id: groupId },
  });
};

const findIssueInGroup = async (groupId, issueRef) => {
  const config = await getGroupJiraConfig(groupId);
  if (!config) {
    return null;
  }

  const numericIssueId = Number(issueRef);
  if (Number.isInteger(numericIssueId) && String(numericIssueId) === String(issueRef)) {
    const byId = await prisma.jira_Issue.findUnique({
      where: { jira_issue_id: numericIssueId },
    });
    if (byId?.jira_project_id === config.jira_project_id) {
      return byId;
    }
  }

  return prisma.jira_Issue.findFirst({
    where: {
      jira_project_id: config.jira_project_id,
      issue_key: issueRef,
    },
  });
};

const syncIssuesToDatabase = async (groupId) => {
  const { adapter, config } = await getAdapter(groupId);

  const jiraIssues = await adapter.getAllIssues(config.project_key);

  let created = 0;
  let updated = 0;

  for (const issue of jiraIssues) {
    const issueData = {
      jira_project_id: config.jira_project_id,
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
        jira_project_id: config.jira_project_id,
        issue_key: issue.key,
      },
    });

    if (existing) {
      await prisma.jira_Issue.update({
        where: { jira_issue_id: existing.jira_issue_id },
        data: issueData,
      });
      updated++;
    } else {
      await prisma.jira_Issue.create({ data: issueData });
      created++;
    }
  }

  return {
    config,
    total_from_jira: jiraIssues.length,
    created,
    updated,
  };
};

const mapIssueResponse = (issue) => ({
  ...issue,
  issue_id: issue.jira_issue_id,
  jiraIssueId: issue.jira_issue_id,
  issueKey: issue.issue_key,
  assigneeEmail: issue.assignee_email,
});

// ═══════════════════════════════════════════════════
// 1. JIRA PROJECT CONFIG
// ═══════════════════════════════════════════════════

// ── GET /api/groups/:groupId/jira ────────────────────
export const getJiraConfig = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    const config = await prisma.jira_Project.findUnique({
      where: { group_id: groupId },
      select: {
        jira_project_id: true,
        group_id: true,
        project_key: true,
        project_name: true,
        base_url: true,
        jira_email: true,
        // KHÔNG trả về jira_api_token (BR-08)
      },
    });

    if (!config) {
      return res.status(200).json({
        success: true,
        message: "Jira project not configured yet",
        data: null,
      });
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/groups/:groupId/jira ───────────────────
export const configureJira = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const {
      project_key,
      project_name,
      base_url,
      jira_email,
      jira_api_token,
      jira_base_url,
      email,
      api_token,
    } = req.body;

    const existingConfig = await prisma.jira_Project.findUnique({
      where: { group_id: groupId },
    });

    const normalizedProjectKey = project_key;
    const normalizedProjectName = project_name || project_key;
    const normalizedBaseUrl = base_url || jira_base_url || existingConfig?.base_url;
    const normalizedJiraEmail = jira_email || email || existingConfig?.jira_email;
    const rawToken = jira_api_token || api_token;
    const normalizedJiraToken = rawToken
      ? rawToken
      : existingConfig?.jira_api_token
        ? decrypt(existingConfig.jira_api_token)
        : null;

    if (
      !normalizedProjectKey ||
      !normalizedBaseUrl ||
      !normalizedJiraEmail ||
      !normalizedJiraToken
    ) {
      return res.status(400).json({
        success: false,
        message: "project_key, base_url, jira_email, and jira_api_token are required",
      });
    }

    // Kiểm tra group tồn tại
    const group = await prisma.student_Group.findUnique({ where: { group_id: groupId } });
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Test kết nối Jira trước khi lưu
    try {
      const adapter = new JiraAdapter(normalizedBaseUrl, normalizedJiraEmail, normalizedJiraToken);
      await adapter.testConnection();
    } catch {
      return res.status(400).json({
        success: false,
        message: "Cannot connect to Jira. Please check your credentials and base_url.",
      });
    }

    // Encrypt token trước khi lưu (BR-08)
    const encryptedToken = rawToken ? encrypt(rawToken) : existingConfig?.jira_api_token;

    // Upsert: nếu đã có config thì update, chưa thì create
    const config = await prisma.jira_Project.upsert({
      where: { group_id: groupId },
      update: {
        project_key: normalizedProjectKey,
        project_name: normalizedProjectName,
        base_url: normalizedBaseUrl,
        jira_email: normalizedJiraEmail,
        jira_api_token: encryptedToken,
      },
      create: {
        group_id: groupId,
        project_key: normalizedProjectKey,
        project_name: normalizedProjectName,
        base_url: normalizedBaseUrl,
        jira_email: normalizedJiraEmail,
        jira_api_token: encryptedToken,
      },
      select: {
        jira_project_id: true,
        group_id: true,
        project_key: true,
        project_name: true,
        base_url: true,
        jira_email: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Jira project configured successfully",
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
// 2. SYNC JIRA ISSUES
// ═══════════════════════════════════════════════════

// ── POST /api/groups/:groupId/jira/sync ──────────────
export const syncJiraIssues = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const syncResult = await syncIssuesToDatabase(groupId);

    res.status(200).json({
      success: true,
      message: `Sync completed: ${syncResult.created} created, ${syncResult.updated} updated`,
      data: {
        total_from_jira: syncResult.total_from_jira,
        created: syncResult.created,
        updated: syncResult.updated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
// 3. JIRA ISSUES (Local DB)
// ═══════════════════════════════════════════════════

// ── GET /api/groups/:groupId/jira/issues ─────────────
export const getIssues = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const shouldAutoSync = req.query.auto_sync !== "false";

    const config = await prisma.jira_Project.findUnique({
      where: { group_id: groupId },
    });
    if (!config) {
      return res.status(404).json({ success: false, message: "Jira project not configured" });
    }

    const issues = await prisma.jira_Issue.findMany({
      where: { jira_project_id: config.jira_project_id },
      orderBy: { created_at: "desc" },
    });

    if (issues.length === 0 && shouldAutoSync) {
      try {
        await syncIssuesToDatabase(groupId);
      } catch {
        // Let FE still receive empty list so UI can continue to load.
      }

      const refreshedIssues = await prisma.jira_Issue.findMany({
        where: { jira_project_id: config.jira_project_id },
        orderBy: { created_at: "desc" },
      });

      return res.status(200).json({
        success: true,
        count: refreshedIssues.length,
        data: refreshedIssues.map(mapIssueResponse),
      });
    }

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues.map(mapIssueResponse),
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/groups/:groupId/jira/issues/:issueId/status ─
export const updateIssueStatus = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const issueRef = req.params.issueId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    // Tìm issue trong DB
    const issue = await findIssueInGroup(groupId, issueRef);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Gọi Jira API để transition
    const { adapter } = await getAdapter(groupId);
    try {
      await adapter.transitionIssue(issue.issue_key, status);
    } catch (jiraError) {
      return res.status(400).json({
        success: false,
        message: `Jira transition failed: ${jiraError.message}`,
      });
    }

    // Cập nhật DB nội bộ
    const updated = await prisma.jira_Issue.update({
      where: { jira_issue_id: issue.jira_issue_id },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: `Issue ${issue.issue_key} status updated to "${status}"`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
// 4. TASK ASSIGNMENT (Flow 1: Leader → Member → Jira)
// ═══════════════════════════════════════════════════

// ── PUT /api/groups/:groupId/jira/issues/:issueId/assign ─
// Leader chọn Member trên Web UI → Backend lưu DB → Backend sync lên Jira
export const assignIssue = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const issueRef = req.params.issueId;
    const userId = req.body.user_id ?? req.body.assignee_id;
    const assigneeEmail = req.body.assignee_email;

    if (!userId && !assigneeEmail) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    // Kiểm tra user là member của nhóm
    let member;

    if (userId) {
      member = await prisma.group_Member.findUnique({
        where: {
          group_id_user_id: { group_id: groupId, user_id: parseInt(userId) },
        },
        include: {
          user: { select: { user_id: true, full_name: true, email: true } },
        },
      });
    } else {
      member = await prisma.group_Member.findFirst({
        where: {
          group_id: groupId,
          user: {
            email: assigneeEmail,
          },
        },
        include: {
          user: { select: { user_id: true, full_name: true, email: true } },
        },
      });
    }

    if (!member) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    // Tìm issue trong DB
    const issue = await findIssueInGroup(groupId, issueRef);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Bước 1: Gọi Jira API để gán assignee trên Jira
    const { adapter } = await getAdapter(groupId);
    try {
      await adapter.updateAssignee(issue.issue_key, member.user.email);
    } catch (jiraError) {
      // Log nhưng không fail — vẫn lưu DB nội bộ
      console.warn(`⚠️ Jira assignee sync failed for ${issue.issue_key}: ${jiraError.message}`);
    }

    // Bước 2: Lưu assignee vào DB nội bộ
    const updated = await prisma.jira_Issue.update({
      where: { jira_issue_id: issue.jira_issue_id },
      data: { assignee_email: member.user.email },
    });

    res.status(200).json({
      success: true,
      message: `Issue ${issue.issue_key} assigned to ${member.user.full_name}`,
      data: {
        issue: updated,
        assignee: member.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
