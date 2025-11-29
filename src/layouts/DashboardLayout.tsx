import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <Navbar />
      <MobileBottomNav />
      
      {/* Main content - adjusted for sidebar on desktop, bottom nav on mobile */}
      <main className={cn(
        "pt-16 min-h-screen pb-20 md:pb-0 transition-all duration-300",
        isCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
