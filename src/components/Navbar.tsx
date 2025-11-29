import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { demoNotifications, formatDate } from '@/data/demoData';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isCollapsed } = useSidebarContext();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  // Get notifications for current user
  const userNotifications = user.role === 'student' 
    ? demoNotifications.filter(n => n.odId === user.id)
    : [];

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (user.role === 'student') {
      navigate('/student/profile');
    }
  };

  return (
    <>
      <nav className={cn(
        "fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 hidden md:block",
        isCollapsed ? "left-16" : "left-64"
      )}>
        <div className="flex items-center justify-end h-full px-6 gap-3">
          {/* Notifications - Student only */}
          {user.role === 'student' && (
            <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Bildirishnomalar</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {userNotifications.length > 0 ? (
                    userNotifications.map(notif => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors",
                          !notif.isRead && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                            notif.type === 'payment' 
                              ? "bg-warning/20 text-warning" 
                              : notif.type === 'system'
                                ? "bg-destructive/20 text-destructive"
                                : "bg-primary/20 text-primary"
                          )}>
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm">{notif.title}</p>
                              {!notif.isRead && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Yangi bildirishnomalar yo'q
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role === 'admin' ? 'Administrator' : 'O\'quvchi'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mening profilim</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === 'student' && (
                <>
                  <DropdownMenuItem onClick={handleProfileClick}>
                    Profilni ko'rish
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} className="text-destructive">
                Chiqish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Mobile navbar */}
      <nav className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-foreground">ABDIYEV SCHOOL</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications - Student only */}
            {user.role === 'student' && (
              <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Bildirishnomalar</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {userNotifications.length > 0 ? (
                      userNotifications.map(notif => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-3 border-b border-border last:border-0",
                            !notif.isRead && "bg-primary/5"
                          )}
                        >
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        Yangi bildirishnomalar yo'q
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            {/* User avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </nav>

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
