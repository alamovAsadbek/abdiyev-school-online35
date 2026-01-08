import {useNavigate} from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/contexts/AuthContext';
import {useSidebarContext} from '@/contexts/SidebarContext';
import {cn} from '@/lib/utils';
import {useState} from 'react';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {NotificationBell} from '@/components/NotificationBell';
import {LogOut} from "lucide-react";

export function Navbar() {
    const {user, logout} = useAuth();
    const {isCollapsed} = useSidebarContext();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (!user) return null;

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
            <nav
                className={cn(
                    'fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 hidden md:block',
                    isCollapsed ? 'left-16' : 'left-64'
                )}
            >
                <div className="flex items-center justify-end h-full px-6 gap-3">
                    {/* Notifications (API) */}
                    <NotificationBell/>

                    {/* User Profile Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 gap-2 px-2 hover:text-white">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-sm">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {user.role === 'admin' ? 'Administrator' : "O'quvchi"}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">

                            {user.role === 'student' && (
                                <>
                                    <DropdownMenuLabel>Mening profilim</DropdownMenuLabel>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuItem onClick={handleProfileClick}
                                                      className='cursor-pointer hover:bg-card'>
                                        Profilni ko'rish</DropdownMenuItem>
                                    <DropdownMenuSeparator/>
                                </>
                            )}
                            <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)}
                                              className="text-destructive hover:bg-destructive cursor-pointer">
                                <LogOut className='mr-2' style={{fontSize: '10px'}}/>
                                Chiqish
                            </DropdownMenuItem>
                           <span className='text-xs font-bold text-gray-600 ml-2 align-middle'>
                               version 1.0.0
                           </span>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </nav>

            {/* Mobile navbar */}
            <nav
                className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
                <div className="flex items-center justify-between h-full px-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                            <span className="text-primary-foreground font-bold text-sm">A</span>
                        </div>
                        <span className="font-semibold text-foreground">ABDIYEV SCHOOL</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <NotificationBell/>
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </div>
            </nav>

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
