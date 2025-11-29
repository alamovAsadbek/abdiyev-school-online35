import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Video, 
  ClipboardList, 
  LogOut,
  GraduationCap,
  Users,
  LayoutDashboard,
  Moon,
  Sun,
  FolderOpen,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const studentNavItems: NavItem[] = [
  { icon: Home, label: 'Bosh sahifa', path: '/student' },
  { icon: FolderOpen, label: 'Kurslar', path: '/student/courses' },
  { icon: Video, label: 'Video darslar', path: '/student/videos' },
  { icon: ClipboardList, label: 'Vazifalar', path: '/student/tasks' },
  { icon: User, label: 'Profil', path: '/student/profile' },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Foydalanuvchilar', path: '/admin/users' },
  { icon: CreditCard, label: 'To\'lovlar', path: '/admin/payments' },
  { icon: FolderOpen, label: 'Kurslar', path: '/admin/categories' },
  { icon: Video, label: 'Video darslar', path: '/admin/videos' },
  { icon: ClipboardList, label: 'Vazifalar', path: '/admin/tasks' },
  { icon: Bell, label: 'Xabarnomalar', path: '/admin/notifications' },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebarContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar flex-col transition-all duration-300 hidden md:flex",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 py-5 transition-all duration-300",
          isCollapsed ? "px-3 justify-center" : "px-6"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shrink-0">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg text-sidebar-foreground">ABDIYEV</h1>
              <p className="text-xs text-muted-foreground">SCHOOL</p>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute top-20 -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-muted transition-colors"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-2 space-y-1 overflow-y-auto",
          isCollapsed ? "px-2" : "px-3"
        )}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && item.path !== '/student' && location.pathname.startsWith(item.path));
            
            const button = (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'sidebar-item w-full',
                  isActive && 'active',
                  isCollapsed && 'justify-center px-0'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {button}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={cn(
          "pb-4 space-y-2",
          isCollapsed ? "px-2" : "px-3"
        )}>
          <Separator className="bg-sidebar-border mb-3" />
          
          {/* Theme Toggle */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="sidebar-item w-full justify-center px-0"
                >
                  {theme === 'light' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === 'light' ? 'Tungi rejim' : 'Kunduzgi rejim'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={toggleTheme}
              className="sidebar-item w-full"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-5 w-5" />
                  <span>Tungi rejim</span>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5" />
                  <span>Kunduzgi rejim</span>
                </>
              )}
            </button>
          )}

          {/* Logout */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="sidebar-item w-full justify-center px-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Chiqish
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="sidebar-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Chiqish</span>
            </button>
          )}
        </div>

        {/* Logout Confirmation */}
        <ConfirmDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
          title="Hisobdan chiqish"
          description="Rostdan ham hisobingizdan chiqmoqchimisiz?"
          confirmText="Ha, chiqish"
          cancelText="Bekor qilish"
          variant="destructive"
          onConfirm={handleLogout}
        />
      </aside>
    </TooltipProvider>
  );
}
