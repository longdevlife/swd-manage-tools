import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getGoogleLoginUrl, getMeApi, loginApi, registerApi } from '@/features/auth/api/authApi';
import { setCredentials } from '@/stores/authSlice';

const ROLE_OPTIONS = [
  { value: 'MEMBER', label: 'Member (Sinh viên)' },
  { value: 'LEADER', label: 'Leader (Trưởng nhóm)' },
  { value: 'LECTURER', label: 'Lecturer (Giảng viên)' },
];

const normalizeUserProfile = (rawUser, fallbackRole = 'MEMBER') => {
  const roles =
    rawUser?.roles || rawUser?.user_roles?.map((ur) => ur?.role?.role_name).filter(Boolean) || [];

  const normalizedGroups =
    rawUser?.groups ||
    rawUser?.group_memberships
      ?.map((membership) => ({
        group_id: membership?.group_id || membership?.student_group?.group_id,
        group_name: membership?.student_group?.group_name,
        semester: membership?.student_group?.semester,
        project_title: membership?.student_group?.project_title,
      }))
      .filter((group) => group?.group_id) ||
    [];

  return {
    ...rawUser,
    groups: normalizedGroups,
    roles,
    role: roles[0] || fallbackRole,
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [roleName, setRoleName] = useState('MEMBER');

  // ── Google OAuth ──────────────────────────────
  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = getGoogleLoginUrl();
  };

  // ── Email/Password Login ──────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập email và mật khẩu');
      return;
    }
    setIsLoading(true);
    try {
      const res = await loginApi({ email, password });
      const data = res?.data || res;
      const token = data.data?.token || data.token;

      // Store token first so /auth/me can be authorized by interceptor.
      localStorage.setItem('accessToken', token);

      let profileUser = data.data?.user || data.user;
      try {
        const meRes = await getMeApi();
        profileUser = meRes?.data?.user || meRes?.user || profileUser;
      } catch {
        // Keep login payload user as fallback when /auth/me fails.
      }

      const userObj = normalizeUserProfile(profileUser, 'MEMBER');
      dispatch(setCredentials({ user: userObj, token }));
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ──────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setIsLoading(true);
    try {
      const res = await registerApi({
        full_name: fullName,
        email,
        password,
        role_name: roleName,
        github_username: githubUsername || undefined,
      });
      const data = res?.data || res;
      const rawUser = data.data?.user || data.user;
      const token = data.data?.token || data.token;
      const userObj = normalizeUserProfile(rawUser, roleName || 'MEMBER');
      dispatch(setCredentials({ user: userObj, token }));
      toast.success('Đăng ký thành công!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-sm text-muted-foreground text-balance">
          {mode === 'login'
            ? 'Sign in to your SWD392 account to continue'
            : 'Enter your information to get started'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="grid gap-4">
        {/* Register: Full Name */}
        {mode === 'register' && (
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                placeholder="Nguyen Van A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@fpt.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Register: Role selection */}
        {mode === 'register' && (
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={roleName} onValueChange={setRoleName}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select your role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Register: GitHub username */}
        {mode === 'register' && (
          <div className="grid gap-2">
            <Label htmlFor="github">
              GitHub Username <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="github"
              placeholder="your-github-username"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full gap-3 h-10"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Sign in with Google
      </Button>

      {/* Toggle login/register */}
      <p className="text-center text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
