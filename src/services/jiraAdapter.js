// JiraAdapter – Gọi Jira REST API (v2)
// Tất cả giao tiếp với Jira đều đi qua adapter này
import axios from "axios";

class JiraAdapter {
  /**
   * @param {string} baseUrl - VD: https://yourproject.atlassian.net
   * @param {string} email - Jira account email
   * @param {string} apiToken - Jira API token (đã decrypt)
   */
  constructor(baseUrl, email, apiToken) {
    // Bỏ trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.client = axios.create({
      baseURL: `${this.baseUrl}/rest/api/2`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      auth: {
        username: email,
        password: apiToken,
      },
      timeout: 15000,
    });
  }

  // ────────────────── PROJECT ──────────────────────

  /**
   * Lấy thông tin project trên Jira
   * @param {string} projectKey - VD: "SWP"
   */
  async getProject(projectKey) {
    const { data } = await this.client.get(`/project/${projectKey}`);
    return data;
  }

  // ────────────────── ISSUES ──────────────────────

  /**
   * Lấy tất cả issues của project (phân trang)
   * @param {string} projectKey
   * @param {number} startAt - offset
   * @param {number} maxResults - limit (max 100)
   */
  async getIssues(projectKey, startAt = 0, maxResults = 100) {
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    const { data } = await this.client.get("/search", {
      params: {
        jql,
        startAt,
        maxResults,
        fields: "summary,status,issuetype,priority,assignee,created",
      },
    });
    return data;
  }

  /**
   * Lấy tất cả issues (auto-paginate)
   * @param {string} projectKey
   */
  async getAllIssues(projectKey) {
    const allIssues = [];
    let startAt = 0;
    const maxResults = 100;

    while (true) {
      const data = await this.getIssues(projectKey, startAt, maxResults);
      allIssues.push(...data.issues);

      if (startAt + maxResults >= data.total) break;
      startAt += maxResults;
    }

    return allIssues;
  }

  /**
   * Tạo issue mới trên Jira
   */
  async createIssue(projectKey, { summary, issueType = "Task", priority }) {
    const fields = {
      project: { key: projectKey },
      summary,
      issuetype: { name: issueType },
    };
    if (priority) fields.priority = { name: priority };

    const { data } = await this.client.post("/issue", { fields });
    return data;
  }

  /**
   * Tìm Jira accountId từ email
   * @param {string} email
   * @returns {string|null} accountId
   */
  async findUserByEmail(email) {
    try {
      const { data } = await this.client.get("/user/search", {
        params: { query: email },
      });
      if (data.length > 0) return data[0].accountId;
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Cập nhật assignee trên Jira (tìm accountId từ email)
   * @param {string} issueKey
   * @param {string} email - email của member
   */
  async updateAssignee(issueKey, email) {
    const accountId = await this.findUserByEmail(email);
    if (!accountId) {
      throw new Error(`Jira user not found for email: ${email}`);
    }
    await this.client.put(`/issue/${issueKey}/assignee`, {
      accountId,
    });
  }

  /**
   * Chuyển trạng thái issue (Transitions)
   * VD: To Do → In Progress → Done
   */
  async transitionIssue(issueKey, targetStatus) {
    // Bước 1: Lấy danh sách transitions khả dụng
    const { data } = await this.client.get(`/issue/${issueKey}/transitions`);
    const transition = data.transitions.find(
      (t) => t.name.toLowerCase() === targetStatus.toLowerCase()
    );

    if (!transition) {
      const available = data.transitions.map((t) => t.name).join(", ");
      throw new Error(
        `Transition "${targetStatus}" not found for ${issueKey}. Available: ${available}`
      );
    }

    // Bước 2: Thực hiện transition
    await this.client.post(`/issue/${issueKey}/transitions`, {
      transition: { id: transition.id },
    });

    return { transitionId: transition.id, transitionName: transition.name };
  }

  /**
   * Lấy thông tin chi tiết 1 issue
   */
  async getIssue(issueKey) {
    const { data } = await this.client.get(`/issue/${issueKey}`, {
      params: {
        fields: "summary,status,issuetype,priority,assignee,created",
      },
    });
    return data;
  }

  /**
   * Test kết nối Jira (validate credentials)
   */
  async testConnection() {
    const { data } = await this.client.get("/myself");
    return data;
  }
}

export default JiraAdapter;
