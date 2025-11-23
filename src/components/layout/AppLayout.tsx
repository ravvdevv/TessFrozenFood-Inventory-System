import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import { ChevronDown, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children?: React.ReactNode;
  userType: 'admin' | 'employee';
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, userType }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleLogout = () => {
      logout();
      navigate('/login');
    };

    // Listen for logout event from sidebar
    window.addEventListener('logout', handleLogout);
    
    // Cleanup
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, [logout, navigate]);
  
  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-background/95 to-background/80">
      <Sidebar userType={userType} />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-sm px-6 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Tess Frozen foods
            </h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="h-8 w-px bg-border/40" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center space-x-2 hover:bg-accent/50 p-2 rounded-lg"
                  aria-label="User menu"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground/80">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userType}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {userType === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-red-600 focus:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
