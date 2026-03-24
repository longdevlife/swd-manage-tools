// Jira Service – Business logic (calls Repository + Adapter)
import * as jiraRepo from "../repositories/jiraRepository.js";
import JiraAdapter from "./jiraAdapter.js";
import { encrypt, decrypt } from "../utils/encryption.js";

// ── Helpers ─────────────────────────────────────────

const createAdapter = async (groupId) => {
  const config = await jiraRepo.findConfigByGroupId(groupId);
  if (!config) {
    const err = new Error("Jira project not configured for this group");
    err.statusCode = 404;
    throw err;
  }
  const decryptedToken = decrypt(config.jira_api_token);
  return { adapter: new JiraAdapter(config.base_url, config.jira_email, decryptedToken), config };
};

const findIssueInGroup = async (groupId, issueRef) => {
  const config = await jiraRepo.findConfigByGroupId(groupId);
  if (!config) return null;

  const numericId = Number(issueRef);
  if (Number.isInteger(numericId) && String(numericId) === String(issueRef)) {
    const byId = await jiraRepo.findIssueById(numericId);
    if (byId?.jira_project_id === config.jira_project_id) return byId;
  }

  return jiraRepo.findIssueByProjectAndKey(config.jira_project_id, issueRef);
};

const mapIssueResponse = (issue) => ({
  ...issue,
  issue_id: issue.jira_issue_id,
  jiraIssueId: issue.jira_issue_id,
  issueKey: issue.issue_key,
  assigneeEmail: issue.assignee_email,
});

// ═══════════════════════════════════════════════════
// 1. GET CONFIG
// ═══════════════════════════════════════════════════
export const getConfig = async (groupId) => {
  return jiraRepo.findConfigByGroupIdSafe(groupId);
};

// ═══════════════════════════════════════════════════
// 2. CONFIGURE JIRA
// ═══════════════════════════════════════════════════
export const configure = async (groupId, body) => {
  const existingConfig = await jiraRepo.findConfigByGroupId(groupId);

  const {
    project_key, project_name, base_url, jira_email,
    jira_api_token, jira_base_url, email, api_token,
  } = body;

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

  if (!normalizedProjectKey || !normalizedBaseUrl || !normalizedJiraEmail || !normalizedJiraToken) {
    const err = new Error("project_key, base_url, jira_email, and jira_api_token are required");
    err.statusCode = 400;
    throw err;
  }

  // Check group tồn tại
  const group = await jiraRepo.findGroupById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  // Test kết nối Jira
  try {
    const adapter = new JiraAdapter(normalizedBaseUrl, normalizedJiraEmail, normalizedJiraToken);
    await adapter.testConnection();
  } catch {
    const err = new Error("Cannot connect to Jira. Please check your credentials and base_url.");
    err.statusCode = 400;
    throw err;
  }

  const encryptedToken = rawToken ? encrypt(rawToken) : existingConfig?.jira_api_token;

  return jiraRepo.upsertConfig(groupId, {
    project_key: normalizedProjectKey,
    project_name: normalizedProjectName,
    base_url: normalizedBaseUrl,
    jira_email: normalizedJiraEmail,
    jira_api_token: encryptedToken,
  });
};

// ═══════════════════════════════════════════════════
// 3. SYNC ISSUES
// ═══════════════════════════════════════════════════
export const syncIssues = async (groupId) => {
  const { adapter, config } = await createAdapter(groupId);
  const jiraIssues = await adapter.getAllIssues(config.project_key);

  let created = 0, updated = 0;

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

    const existing = await jiraRepo.findIssueByProjectAndKey(config.jira_project_id, issue.key);

    if (existing) {
      await jiraRepo.updateIssue(existing.jira_issue_id, issueData);
      updated++;
    } else {
      await jiraRepo.createIssue(issueData);
      created++;
    }
  }

  return { config, total_from_jira: jiraIssues.length, created, updated };
};

// ═══════════════════════════════════════════════════
// 4. GET ISSUES (local DB) — auto-sync nếu rỗng
// ═══════════════════════════════════════════════════
export const getIssues = async (groupId, shouldAutoSync = true) => {
  const config = await jiraRepo.findConfigByGroupId(groupId);
  if (!config) {
    const err = new Error("Jira project not configured");
    err.statusCode = 404;
    throw err;
  }

  let issues = await jiraRepo.findIssuesByProjectId(config.jira_project_id);

  if (issues.length === 0 && shouldAutoSync) {
    try { await syncIssues(groupId); } catch { /* ignore */ }
    issues = await jiraRepo.findIssuesByProjectId(config.jira_project_id);
  }

  return issues.map(mapIssueResponse);
};

// ═══════════════════════════════════════════════════
// 5. UPDATE ISSUE STATUS
// ═══════════════════════════════════════════════════
export const updateIssueStatus = async (groupId, issueRef, status) => {
  const issue = await findIssueInGroup(groupId, issueRef);
  if (!issue) {
    const err = new Error("Issue not found");
    err.statusCode = 404;
    throw err;
  }

  const { adapter } = await createAdapter(groupId);
  try {
    await adapter.transitionIssue(issue.issue_key, status);
  } catch (jiraError) {
    const err = new Error(`Jira transition failed: ${jiraError.message}`);
    err.statusCode = 400;
    throw err;
  }

  return jiraRepo.updateIssue(issue.jira_issue_id, { status });
};

// ═══════════════════════════════════════════════════
// 6. ASSIGN ISSUE
// ═══════════════════════════════════════════════════
export const assignIssue = async (groupId, issueRef, { userId, assigneeEmail }) => {
  if (!userId && !assigneeEmail) {
    const err = new Error("user_id is required");
    err.statusCode = 400;
    throw err;
  }

  // Check member thuộc nhóm
  let member;
  if (userId) {
    member = await jiraRepo.findMemberByGroupAndUser(groupId, parseInt(userId));
  } else {
    member = await jiraRepo.findMemberByGroupAndEmail(groupId, assigneeEmail);
  }

  if (!member) {
    const err = new Error("User is not a member of this group");
    err.statusCode = 400;
    throw err;
  }

  // Find issue
  const issue = await findIssueInGroup(groupId, issueRef);
  if (!issue) {
    const err = new Error("Issue not found");
    err.statusCode = 404;
    throw err;
  }

  // Sync lên Jira (graceful — không fail nếu Jira lỗi)
  const { adapter } = await createAdapter(groupId);
  try {
    await adapter.updateAssignee(issue.issue_key, member.user.email);
  } catch (jiraError) {
    console.warn(`⚠️ Jira assignee sync failed for ${issue.issue_key}: ${jiraError.message}`);
  }

  // Lưu DB nội bộ
  const updated = await jiraRepo.updateIssue(issue.jira_issue_id, { assignee_email: member.user.email });

  return { issue: updated, assignee: member.user };
};
