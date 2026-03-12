// GitHubAdapter – Gọi GitHub REST API (v3)
// Tất cả giao tiếp với GitHub đều đi qua adapter này
import axios from "axios";

class GitHubAdapter {
  /**
   * @param {string} owner - VD: "longdevlife"
   * @param {string} repo  - VD: "swd-be"
   * @param {string} pat   - GitHub Personal Access Token (đã decrypt)
   */
  constructor(owner, repo, pat) {
    this.owner = owner;
    this.repo = repo;
    this.client = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${pat}`,
      },
      timeout: 15000,
    });
  }

  // ────────────────── REPOSITORY ──────────────────────

  /**
   * Lấy thông tin repository
   */
  async getRepository() {
    const { data } = await this.client.get(`/repos/${this.owner}/${this.repo}`);
    return data;
  }

  /**
   * Test kết nối GitHub (validate PAT + repo access)
   */
  async testConnection() {
    const repoData = await this.getRepository();
    return {
      full_name: repoData.full_name,
      private: repoData.private,
      default_branch: repoData.default_branch,
    };
  }

  // ────────────────── COMMITS ──────────────────────

  /**
   * Lấy commits theo trang
   * @param {number} page
   * @param {number} perPage - max 100
   * @param {string} [since] - ISO date, chỉ lấy commits sau thời điểm này
   */
  async getCommits(page = 1, perPage = 100, since = null) {
    const params = { page, per_page: perPage };
    if (since) params.since = since;

    const { data } = await this.client.get(
      `/repos/${this.owner}/${this.repo}/commits`,
      { params }
    );
    return data;
  }

  /**
   * Lấy TẤT CẢ commits (auto-paginate)
   * @param {string} [since] - ISO date
   */
  async getAllCommits(since = null) {
    const allCommits = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const commits = await this.getCommits(page, perPage, since);
      if (commits.length === 0) break;

      allCommits.push(...commits);

      // GitHub trả < perPage → hết trang
      if (commits.length < perPage) break;
      page++;
    }

    return allCommits;
  }

  /**
   * Lấy chi tiết 1 commit (bao gồm stats: additions, deletions)
   * @param {string} sha - commit hash
   */
  async getCommitDetail(sha) {
    const { data } = await this.client.get(
      `/repos/${this.owner}/${this.repo}/commits/${sha}`
    );
    return {
      sha: data.sha,
      message: data.commit.message,
      author_name: data.commit.author?.name,
      author_email: data.commit.author?.email,
      date: data.commit.author?.date,
      stats: data.stats, // { total, additions, deletions }
    };
  }

  /**
   * Lấy danh sách contributors
   */
  async getContributors() {
    const { data } = await this.client.get(
      `/repos/${this.owner}/${this.repo}/contributors`
    );
    return data;
  }
}

export default GitHubAdapter;
