import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Settings, Save, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { selectCurrentUser } from '@/stores/authSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getGroupsApi } from '@/features/groups/api/groupsApi';
import { getJiraConfigApi, configureJiraApi } from '@/features/jira/api/jiraApi';
import { getGitHubConfigApi, configureGitHubApi } from '@/features/github/api/githubApi';

export function LectureSettingsPage() {
  const user = useSelector(selectCurrentUser);
  const activeGroupId = useSelector((state) => state.ui?.activeGroupId);

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  // ── Jira config state ──
  const [jiraConfig, setJiraConfig] = useState({
    base_url: '',
    project_key: '',
    jira_email: '',
    jira_api_token: '',
  });
  const [jiraConnected, setJiraConnected] = useState(false);
  const [jiraSaving, setJiraSaving] = useState(false);

  // ── GitHub config state ──
  const [githubConfig, setGithubConfig] = useState({ repo_url: '', github_token: '' });
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubSaving, setGithubSaving] = useState(false);

  // ── Fetch groups ──
  useEffect(() => {
    (async () => {
      try {
        const res = await getGroupsApi();
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setGroups(
          list.map((g) => ({
            id: g.group_id || g.id,
            name: g.group_name || g.name || `Group ${g.group_id}`,
          })),
        );
        const defaultGid =
          activeGroupId ||
          user?.groups?.[0]?.group_id ||
          (list[0] && (list[0].group_id || list[0].id));
        if (defaultGid) setSelectedGroup(String(defaultGid));
      } catch {
        toast.error('Could not load groups');
      }
    })();
  }, [activeGroupId, user]);

  // ── Fetch configs when group changes ──
  const fetchConfigs = useCallback(async () => {
    if (!selectedGroup) return;
    const gid = Number(selectedGroup);
    // Jira config
    try {
      const res = await getJiraConfigApi(gid);
      const data = res?.data || res || {};
      setJiraConfig({
        base_url: data.base_url || data.jira_base_url || '',
        project_key: data.project_key || data.jira_project_key || '',
        jira_email: data.jira_email || data.email || '',
        jira_api_token: data.jira_email || data.email ? '••••••••' : '',
      });
      setJiraConnected(!!(data.base_url || data.jira_base_url));
    } catch {
      setJiraConfig({ base_url: '', project_key: '', jira_email: '', jira_api_token: '' });
      setJiraConnected(false);
    }
    // GitHub config
    try {
      const res = await getGitHubConfigApi(gid);
      const data = res?.data || res || {};
      setGithubConfig({
        repo_url: data.repo_url || data.github_repo_url || '',
        github_token: data.github_token ? '••••••••' : '',
      });
      setGithubConnected(!!(data.repo_url || data.github_repo_url));
    } catch {
      setGithubConfig({ repo_url: '', github_token: '' });
      setGithubConnected(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // ── Save Jira ──
  const handleSaveJira = async () => {
    if (!selectedGroup) return;
    setJiraSaving(true);
    try {
      const payload = { ...jiraConfig };
      if (payload.jira_api_token === '••••••••') delete payload.jira_api_token;
      await configureJiraApi(Number(selectedGroup), payload);
      toast.success('Cấu hình Jira đã lưu!');
      setJiraConnected(true);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Lưu Jira thất bại');
    } finally {
      setJiraSaving(false);
    }
  };

  // ── Save GitHub ──
  const handleSaveGitHub = async () => {
    if (!selectedGroup) return;
    setGithubSaving(true);
    try {
      // Parse repo_url to extract owner and repo_name
      // e.g. "https://github.com/longdevlife/swd-be" → owner="longdevlife", repo_name="swd-be"
      const url = githubConfig.repo_url.trim().replace(/\/+$/, '');
      const parts = url.split('/');
      const repo_name = parts.pop();
      const owner = parts.pop();

      if (!owner || !repo_name) {
        toast.error('URL không hợp lệ. Ví dụ: https://github.com/owner/repo');
        setGithubSaving(false);
        return;
      }

      const payload = {
        repo_name,
        repo_url: githubConfig.repo_url.trim(),
        owner,
        github_pat: githubConfig.github_token,
      };
      // Don't send masked token
      if (payload.github_pat === '••••••••') delete payload.github_pat;

      await configureGitHubApi(Number(selectedGroup), payload);
      toast.success('Cấu hình GitHub đã lưu!');
      setGithubConnected(true);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Lưu GitHub thất bại');
    } finally {
      setGithubSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình Jira Project và GitHub Repository cho nhóm
        </p>
      </div>

      {/* Group Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Group</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-full sm:w-70">
              <SelectValue placeholder="Chọn nhóm..." />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedGroup && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ═══ JIRA Configuration ═══ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11.53 2H2v9.53l.44.44 8.65-8.65L11.53 2Zm1.94 0L2 13.47V22h8.53l.44-.44L2.44 13.03l.53-.53L22 3.47V2h-8.53Z"
                        fill="#2684FF"
                      />
                    </svg>
                    Jira Configuration
                  </CardTitle>
                  <CardDescription>Kết nối Jira Cloud để đồng bộ issues</CardDescription>
                </div>
                <Badge variant={jiraConnected ? 'default' : 'secondary'} className="gap-1">
                  {jiraConnected ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {jiraConnected ? 'Connected' : 'Not configured'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="jira-base-url">Jira Base URL</Label>
                <Input
                  id="jira-base-url"
                  placeholder="https://your-org.atlassian.net"
                  value={jiraConfig.base_url}
                  onChange={(e) => setJiraConfig((p) => ({ ...p, base_url: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jira-project-key">Project Key</Label>
                <Input
                  id="jira-project-key"
                  placeholder="e.g., SWP"
                  value={jiraConfig.project_key}
                  onChange={(e) => setJiraConfig((p) => ({ ...p, project_key: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jira-email">Jira Email</Label>
                <Input
                  id="jira-email"
                  type="email"
                  placeholder="your@email.com"
                  value={jiraConfig.jira_email}
                  onChange={(e) => setJiraConfig((p) => ({ ...p, jira_email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jira-token">API Token</Label>
                <Input
                  id="jira-token"
                  type="password"
                  placeholder="Jira API Token"
                  value={jiraConfig.jira_api_token}
                  onChange={(e) => setJiraConfig((p) => ({ ...p, jira_api_token: e.target.value }))}
                />
              </div>
              <Separator />
              <Button onClick={handleSaveJira} disabled={jiraSaving} className="w-full">
                {jiraSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Jira Config
              </Button>
            </CardContent>
          </Card>

          {/* ═══ GITHUB Configuration ═══ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub Configuration
                  </CardTitle>
                  <CardDescription>Kết nối GitHub Repository để đồng bộ commits</CardDescription>
                </div>
                <Badge variant={githubConnected ? 'default' : 'secondary'} className="gap-1">
                  {githubConnected ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {githubConnected ? 'Connected' : 'Not configured'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="github-repo">Repository URL</Label>
                <Input
                  id="github-repo"
                  placeholder="https://github.com/org/repo"
                  value={githubConfig.repo_url}
                  onChange={(e) => setGithubConfig((p) => ({ ...p, repo_url: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubConfig.github_token}
                  onChange={(e) => setGithubConfig((p) => ({ ...p, github_token: e.target.value }))}
                />
              </div>
              <Separator />
              <Button onClick={handleSaveGitHub} disabled={githubSaving} className="w-full">
                {githubSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save GitHub Config
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
