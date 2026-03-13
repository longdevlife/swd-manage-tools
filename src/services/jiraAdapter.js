// JiraAdapter – Gọi Jira REST API (v3)
// Tất cả giao tiếp với Jira đều đi qua adapter này
import axios from 'axios';

class JiraAdapter {
  /**
   * @param {string} baseUrl - VD: https://yourproject.atlassian.net
   * @param {string} email - Jira account email
   * @param {string} apiToken - Jira API token (đã decrypt)
   */
  constructor(baseUrl, email, apiToken) {
    // Bỏ trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.client = axios.create({
      baseURL: `${this.baseUrl}/rest/api/3`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
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
  async getIssues(projectKey, startAt = 0, maxResults = 100, nextPageToken = null) {
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    const legacyPayload = {
      jql,
      startAt,
      maxResults,
      fields: ['summary', 'status', 'issuetype', 'priority', 'assignee', 'created'],
    };
    const enhancedPayload = {
      jql,
      maxResults,
      fields: ['summary', 'status', 'issuetype', 'priority', 'assignee', 'created'],
      ...(nextPageToken ? { nextPageToken } : {}),
    };

    const attempts = [
      // New enhanced API (Atlassian migration path)
      async () => this.client.post('/search/jql', enhancedPayload),
      async () =>
        this.client.get('/search/jql', {
          params: {
            jql,
            maxResults,
            fields: ['summary', 'status', 'issuetype', 'priority', 'assignee', 'created'],
            ...(nextPageToken ? { nextPageToken } : {}),
          },
        }),
      // Legacy endpoints kept as fallback for older tenants.
      async () => this.client.post('/search', legacyPayload),
      async () =>
        this.client.get('/search', {
          params: {
            jql,
            startAt,
            maxResults,
            fields: 'summary,status,issuetype,priority,assignee,created',
          },
        }),
    ];

    const errors = [];

    for (const attempt of attempts) {
      try {
        const { data } = await attempt();
        return data;
      } catch (error) {
        errors.push(this.formatJiraError(error));
      }
    }

    const detail = errors.join(' | ');
    throw new Error(`Jira search failed for project "${projectKey}". ${detail}`);
  }

  formatJiraError(error) {
    const status = error?.response?.status;
    const endpoint = error?.config?.url || 'unknown-endpoint';
    const data = error?.response?.data;

    const errorMessages = Array.isArray(data?.errorMessages) ? data.errorMessages.join('; ') : '';
    const fieldErrors =
      data?.errors && typeof data.errors === 'object'
        ? Object.entries(data.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('; ')
        : '';

    const details = [errorMessages, fieldErrors].filter(Boolean).join(' | ');
    return `${endpoint} -> ${status || 'no-status'}${details ? ` (${details})` : ''}`;
  }

  /**
   * Lấy tất cả issues (auto-paginate)
   * @param {string} projectKey
   */
  async getAllIssues(projectKey) {
    const allIssues = [];
    let startAt = 0;
    let nextPageToken = null;
    const maxResults = 100;

    while (true) {
      const data = await this.getIssues(projectKey, startAt, maxResults, nextPageToken);
      allIssues.push(...data.issues);

      // Enhanced API pagination via continuation token.
      if (data.nextPageToken) {
        nextPageToken = data.nextPageToken;
        continue;
      }

      // Enhanced API may return isLast without total/startAt.
      if (data.isLast === true) break;

      // Legacy API pagination via startAt/total.
      if (typeof data.total === 'number') {
        if (startAt + maxResults >= data.total) break;
        startAt += maxResults;
        continue;
      }

      // Safety stop when no clear pagination metadata is present.
      break;
    }

    return allIssues;
  }

  /**
   * Tạo issue mới trên Jira
   */
  async createIssue(projectKey, { summary, issueType = 'Task', priority }) {
    const fields = {
      project: { key: projectKey },
      summary,
      issuetype: { name: issueType },
    };
    if (priority) fields.priority = { name: priority };

    const { data } = await this.client.post('/issue', { fields });
    return data;
  }

  /**
   * Tìm Jira accountId từ email
   * @param {string} email
   * @returns {string|null} accountId
   */
  async findUserByEmail(email) {
    try {
      const { data } = await this.client.get('/user/search', {
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
      (t) => t.name.toLowerCase() === targetStatus.toLowerCase(),
    );

    if (!transition) {
      const available = data.transitions.map((t) => t.name).join(', ');
      throw new Error(
        `Transition "${targetStatus}" not found for ${issueKey}. Available: ${available}`,
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
        fields: 'summary,status,issuetype,priority,assignee,created',
      },
    });
    return data;
  }

  /**
   * Test kết nối Jira (validate credentials)
   */
  async testConnection() {
    const { data } = await this.client.get('/myself');
    return data;
  }
}

export default JiraAdapter;
