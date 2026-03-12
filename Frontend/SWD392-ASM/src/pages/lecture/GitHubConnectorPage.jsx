import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, GitBranch, GitCommit, Calendar, User, CheckCircle2, XCircle, RefreshCw, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';

// Mock data for connected repositories
const mockConnectedRepos = [
  {
    id: 1,
    studentName: 'John Smith',
    studentId: 'SE160001',
    repoUrl: 'https://github.com/johnsmith/swd-project',
    repoName: 'swd-project',
    status: 'connected',
    lastSync: '2024-03-07 10:30',
    totalCommits: 45,
    branch: 'main'
  },
  {
    id: 2,
    studentName: 'Emily Johnson',
    studentId: 'SE160002',
    repoUrl: 'https://github.com/emilyjohnson/web-app',
    repoName: 'web-app',
    status: 'connected',
    lastSync: '2024-03-07 09:15',
    totalCommits: 32,
    branch: 'develop'
  },
  {
    id: 3,
    studentName: 'Michael Brown',
    studentId: 'SE160003',
    repoUrl: 'https://github.com/michaelbrown/mobile-app',
    repoName: 'mobile-app',
    status: 'error',
    lastSync: '2024-03-06 14:20',
    totalCommits: 28,
    branch: 'main'
  },
];

// Mock data for commits
const mockCommits = [
  {
    id: 1,
    studentName: 'John Smith',
    studentId: 'SE160001',
    message: 'Add user authentication module',
    author: 'John Smith',
    date: '2024-03-07 10:25',
    sha: 'a1b2c3d',
    branch: 'main',
    additions: 156,
    deletions: 23
  },
  {
    id: 2,
    studentName: 'John Smith',
    studentId: 'SE160001',
    message: 'Fix login validation bug',
    author: 'John Smith',
    date: '2024-03-07 09:45',
    sha: 'e4f5g6h',
    branch: 'main',
    additions: 12,
    deletions: 8
  },
  {
    id: 3,
    studentName: 'Emily Johnson',
    studentId: 'SE160002',
    message: 'Implement dashboard UI',
    author: 'Emily Johnson',
    date: '2024-03-07 09:10',
    sha: 'i7j8k9l',
    branch: 'develop',
    additions: 243,
    deletions: 15
  },
  {
    id: 4,
    studentName: 'Emily Johnson',
    studentId: 'SE160002',
    message: 'Update API endpoints',
    author: 'Emily Johnson',
    date: '2024-03-06 16:30',
    sha: 'm0n1o2p',
    branch: 'develop',
    additions: 89,
    deletions: 34
  },
  {
    id: 5,
    studentName: 'Michael Brown',
    studentId: 'SE160003',
    message: 'Setup project structure',
    author: 'Michael Brown',
    date: '2024-03-06 14:15',
    sha: 'q3r4s5t',
    branch: 'main',
    additions: 312,
    deletions: 0
  },
];

export function GitHubConnectorPage() {
  const [connectedRepos, setConnectedRepos] = useState(mockConnectedRepos);
  const [commits, setCommits] = useState(mockCommits);
  const [isAddRepoDialogOpen, setIsAddRepoDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [githubToken, setGithubToken] = useState('');
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [syncingRepoId, setSyncingRepoId] = useState(null);

  // New repo form state
  const [newRepo, setNewRepo] = useState({
    studentName: '',
    studentId: '',
    repoUrl: '',
    branch: 'main'
  });

  const handleSaveToken = () => {
    if (githubToken.trim()) {
      setIsTokenSaved(true);
      // Here you would save the token to backend
    }
  };

  const handleSyncRepo = (repoId) => {
    setSyncingRepoId(repoId);
    // Simulate API call
    setTimeout(() => {
      setConnectedRepos(repos => repos.map(repo => 
        repo.id === repoId 
          ? { ...repo, lastSync: new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, -3), status: 'connected' }
          : repo
      ));
      setSyncingRepoId(null);
    }, 1500);
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
              <p className="text-xs text-muted-foreground">
                Create token at: Settings → Developer settings → Personal access tokens → Tokens (classic)
              </p>
            </div>
            <Button onClick={handleSaveToken} className="gap-2">
              {isTokenSaved ? <CheckCircle2 size={16} /> : <Github size={16} />}
              {isTokenSaved ? 'Saved' : 'Save Token'}
            </Button>
          </div>
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
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User size={12} />
                          {commit.author}
                        </p>
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
