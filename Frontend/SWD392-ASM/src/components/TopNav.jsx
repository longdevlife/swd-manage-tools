import { Bell, Maximize, Search, Settings, ShieldCheck, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/stores/authSlice';

export function TopNav({ user }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const initials = user?.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : 'U';

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-14 items-center gap-4 px-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search (Ctrl+K)"
          className="h-9 w-full max-w-sm bg-transparent pl-7 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
        />
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Sun size={18} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Settings size={18} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Maximize size={18} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative ml-1 h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.name || user?.username || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              My Profile
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="font-medium text-primary"
                  onClick={() => navigate('/admin')}
                >
                  <ShieldCheck size={14} className="mr-2" />
                  Admin Panel
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
