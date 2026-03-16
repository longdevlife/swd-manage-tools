import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, GitBranch, GitCommit, Calendar, User as UserIcon, CheckCircle2, XCircle, RefreshCw, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/stores/authSlice';
import { getGitHubConfigApi, getCommitsApi, syncCommitsApi, configureGitHubApi } from '@/features/github/api/githubApi';
import { getGroupsApi } from '@/features/groups/api/groupsApi';
import { toast } from 'sonner';
import { Component } from 'react';

// Error Boundary wrapper
class GitHubErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-bold">GitHub Connector Error</h2>
            <pre className="text-sm text-red-600 mt-2 whitespace-pre-wrap">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <pre className="text-xs text-red-400 mt-1 whitespace-pre-wrap">
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function GitHubConnectorPage() {
  return (
    <GitHubErrorBoundary>
      <GitHubConnectorPageInner />
    </GitHubErrorBoundary>
  );
}

function GitHubConnectorPageInner() {
  useSelector(selectCurrentUser);
  const [connectedRepos, setConnectedRepos] = useState([]);
  const [commits, setCommits] = useState([]);
  const [isAddRepoDialogOpen, setIsAddRepoDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [githubToken, setGithubToken] = useState('');
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [syncingRepoId, setSyncingRepoId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const groupsRes = await getGroupsApi().catch(() => ({ data: [] }));
        const groupsList = Array.isArray(groupsRes?.data) ? groupsRes.data : Array.isArray(groupsRes) ? groupsRes : [];
        const repos = [];
        const allCommits = [];
        for (const g of groupsList) {
          const gid = g.group_id || g.id;
          try {
            const cfg = await getGitHubConfigApi(gid).catch(() => null);
            if (cfg?.data || cfg) {
              const config = cfg?.data || cfg;
              repos.push({
                id: gid,
                studentName: g.group_name || g.name || `Group ${gid}`,
                studentId: `GRP-${gid}`,
                repoUrl: config.repo_url || config.repository || '',
                repoName: (config.repo_url || config.repository || '').split('/').pop() || '',
                status: config.repo_url ? 'connected' : 'error',
                lastSync: config.last_synced_at || config.updated_at || '',
                totalCommits: 0,
                branch: config.branch || 'main',
              });
            }
          } catch { /* skip */ }
          try {
            const commitsRes = await getCommitsApi(gid).catch(() => ({ data: [] }));
            const cList = Array.isArray(commitsRes?.data) ? commitsRes.data : Array.isArray(commitsRes) ? commitsRes : [];
            cList.forEach((c) => {
              allCommits.push({
                id: c.id || c.commit_sha || `${gid}-${allCommits.length}`,
                studentName: g.group_name || g.name || '',
                studentId: `GRP-${gid}`,
                message: c.message || c.commit_message || '',
                author: c.author_name || (typeof c.author === 'object' ? (c.author?.full_name || c.author?.github_username || c.author?.email) : c.author) || '',
                date: c.committed_at || c.created_at || '',
                sha: (c.sha || c.commit_sha || '').slice(0, 7),
                branch: c.branch || 'main',
                additions: c.additions || 0,
                deletions: c.deletions || 0,
              });
            });
            const r = repos.find((r) => r.id === gid);
            if (r) r.totalCommits = cList.length;
          } catch { /* skip */ }
        }
        if (!cancelled) {
          setConnectedRepos(repos);
          setCommits(allCommits);
        }
      } catch { /* empty */ }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  // New repo form state
  const [newRepo, setNewRepo] = useState({
    studentName: '',
    studentId: '',
    repoUrl: '',
    branch: 'main'
  });

  const handleSaveToken = async () => {
    if (!githubToken.trim()) return;
    // Try configuring the first available group with this token
    const gid = connectedRepos[0]?.id;
    if (gid) {
      try {
        await configureGitHubApi(gid, { github_token: githubToken.trim() });
        setIsTokenSaved(true);
        toast.success('GitHub token saved!');
      } catch {
        toast.error('Failed to save token');
      }
    } else {
      setIsTokenSaved(true);
    }
  };

  const handleSyncRepo = async (repoId) => {
    setSyncingRepoId(repoId);
    try {
      await syncCommitsApi(repoId);
      setConnectedRepos(repos => repos.map(repo =>
        repo.id === repoId
          ? { ...repo, lastSync: new Date().toISOString(), status: 'connected' }
          : repo
      ));
      toast.success('Sync completed!');
      // Refresh commits for this group
      const commitsRes = await getCommitsApi(repoId).catch(() => ({ data: [] }));
      const cList = Array.isArray(commitsRes?.data) ? commitsRes.data : [];
      // Update global commits list
      setCommits((prev) => {
        const filtered = prev.filter((c) => c.studentId !== `GRP-${repoId}`);
        const newCommits = cList.map((c) => ({
          id: c.id || c.commit_sha,
          studentName: connectedRepos.find(r => r.id === repoId)?.studentName || '',
          studentId: `GRP-${repoId}`,
          message: c.message || c.commit_message || '',
          author: c.author_name || (typeof c.author === 'object' ? (c.author?.full_name || c.author?.github_username || c.author?.email) : c.author) || '',
          date: c.committed_at || c.created_at || '',
          sha: (c.sha || c.commit_sha || '').slice(0, 7),
          branch: c.branch || 'main',
          additions: c.additions || 0,
          deletions: c.deletions || 0,
        }));
        return [...newCommits, ...filtered];
      });
    } catch {
      toast.error('Sync failed');
    }
    setSyncingRepoId(null);
  };

  const handleAddRepo = () => {
    if (newRepo.studentName && newRepo.studentId && newRepo.repoUrl) {
      const repoName = newRepo.repoUrl.split('/').pop();
      const newRepoData = {
        id: connectedRepos.length + 1,
        ...newRepo,
        repoName,
        status: 'connected',
        lastSync: new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, -3),
        totalCommits: 0
      };
      setConnectedRepos([...connectedRepos, newRepoData]);
      setIsAddRepoDialogOpen(false);
      setNewRepo({ studentName: '', studentId: '', repoUrl: '', branch: 'main' });
    }
  };

  const handleRemoveRepo = (repoId) => {
    setConnectedRepos(repos => repos.filter(repo => repo.id !== repoId));
  };

  const filteredCommits = selectedStudent === 'all' 
    ? commits 
    : commits.filter(commit => commit.studentId === selectedStudent);

  const totalCommits = connectedRepos.reduce((sum, repo) => sum + repo.totalCommits, 0);
  const activeRepos = connectedRepos.filter(repo => repo.status === 'connected').length;
  const errorRepos = connectedRepos.filter(repo => repo.status === 'error').length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="GitHub Connector"
        description="Manage student repositories, monitor commits, and configure GitHub integration"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setIsAddRepoDialogOpen(true)} className="gap-2">
              <LinkIcon size={16} />
              Add Repository
            </Button>
          </div>
        }
      />

      {/* GitHub Token Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github size={20} />
            GitHub Personal Access Token
          </CardTitle>
          <CardDescription>
            Enter your GitHub Personal Access Token to enable repository synchronization and commit tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="github-token">GitHub Personal Access Token</Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveToken} className="gap-2 shrink-0">
              {isTokenSaved ? <CheckCircle2 size={16} /> : <Github size={16} />}
              {isTokenSaved ? 'Saved' : 'Save Token'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Create token at: Settings → Developer settings → Personal access tokens → Tokens (classic)
          </p>
          {isTokenSaved && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 size={16} />
              Token configured successfully
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
            <GitCommit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommits}</div>
            <p className="text-xs text-muted-foreground">From all repositories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Repos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRepos}</div>
            <p className="text-xs text-muted-foreground">Connected successfully</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Repos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorRepos}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Repositories */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Repositories</CardTitle>
          <CardDescription>List of student GitHub repositories</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commits</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectedRepos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No repositories connected yet
                  </TableCell>
                </TableRow>
              ) : (
                connectedRepos.map((repo) => (
                  <TableRow key={repo.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{repo.studentName}</div>
                        <div className="text-sm text-muted-foreground">{repo.studentId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={repo.repoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Github size={14} />
                        {repo.repoName}
                        <ExternalLink size={12} />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <GitBranch size={12} />
                        {repo.branch}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {repo.status === 'connected' ? (
                        <Badge className="bg-green-500 gap-1">
                          <CheckCircle2 size={12} />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle size={12} />
                          Error
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{repo.totalCommits}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {repo.lastSync}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncRepo(repo.id)}
                          disabled={syncingRepoId === repo.id}
                          className="gap-1"
                        >
                          <RefreshCw size={14} className={syncingRepoId === repo.id ? 'animate-spin' : ''} />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveRepo(repo.id)}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Commit History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Commit History</CardTitle>
              <CardDescription>List of commits from all repositories</CardDescription>
            </div>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {connectedRepos.map((repo) => (
                  <SelectItem key={repo.id} value={repo.studentId}>
                    {repo.studentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>SHA</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No commits found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommits.map((commit) => (
                  <TableRow key={commit.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{commit.studentName}</div>
                        <div className="text-sm text-muted-foreground">{commit.studentId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-medium truncate">{commit.message}</p>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <UserIcon size={12} />
                          {commit.author}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <GitBranch size={12} />
                        {commit.branch}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{commit.sha}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 text-sm">
                        <span className="text-green-600">+{commit.additions}</span>
                        <span className="text-red-600">-{commit.deletions}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {commit.date}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Repository Dialog */}
      <Dialog open={isAddRepoDialogOpen} onOpenChange={setIsAddRepoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Repository</DialogTitle>
            <DialogDescription>
              Connect student GitHub repository to track commits
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Student Name</Label>
              <Input
                id="student-name"
                placeholder="John Doe"
                value={newRepo.studentName}
                onChange={(e) => setNewRepo({ ...newRepo, studentName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-id">Student ID</Label>
              <Input
                id="student-id"
                placeholder="SE160001"
                value={newRepo.studentId}
                onChange={(e) => setNewRepo({ ...newRepo, studentId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repository"
                value={newRepo.repoUrl}
                onChange={(e) => setNewRepo({ ...newRepo, repoUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                placeholder="main"
                value={newRepo.branch}
                onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRepoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRepo}>
              Add Repository
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
