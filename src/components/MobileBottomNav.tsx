import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Video, 
  ClipboardList, 
  User,
  MoreHorizontal,
  FolderOpen,
  LayoutDashboard,
  Users,
  CreditCard,
  X,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const studentNavItems: NavItem[] = [
  { icon: Home, label: 'Bosh sahifa', path: '/student' },
  { icon: FolderOpen, label: 'Kategoriyalar', path: '/student/categories' },
  { icon: Video, label: 'Video darslar', path: '/student/videos' },
  { icon: ClipboardList, label: 'Vazifalar', path: '/student/tasks' },
  { icon: User, label: 'Profil', path: '/student/profile' },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Foydalanuvchilar', path: '/admin/users' },
  { icon: CreditCard, label: 'To\'lovlar', path: '/admin/payments' },
  { icon: FolderOpen, label: 'Kategoriyalar', path: '/admin/categories' },
  { icon: Video, label: 'Video darslar', path: '/admin/videos' },
  { icon: ClipboardList, label: 'Vazifalar', path: '/admin/tasks' },
];

export function MobileBottomNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;
  
  // Show first 4 items in bottom nav, rest in "More" sheet
  const visibleItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);

  const isActive = (path: string) => {
    return location.pathname === path || 
      (path !== '/admin' && path !== '/student' && location.pathname.startsWith(path));
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMoreOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {visibleItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive(item.path) 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform",
                isActive(item.path) && "scale-110"
              )} />
              <span className="text-[10px] font-medium truncate max-w-[60px]">{item.label}</span>
            </button>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
              isMoreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">Boshqalar</span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center">Boshqa bo'limlar</SheetTitle>
          </SheetHeader>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {moreItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all",
                  isActive(item.path) 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80 text-foreground"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Additional Actions */}
          <div className="space-y-2 pt-4 border-t border-border">
            <button
              onClick={() => {
                toggleTheme();
                setIsMoreOpen(false);
              }}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Tungi rejim</span>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Kunduzgi rejim</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsMoreOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Chiqish</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

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
    </>
  );
}
