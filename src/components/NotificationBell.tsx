import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { demoPayments, getDaysUntilExpiry, formatDate } from '@/data/demoData';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || user.role === 'admin') return null;

  // Get active payment for user
  const activePayment = demoPayments.find(
    p => p.odId === user.id && p.status === 'active'
  );

  const notifications = [];

  if (activePayment) {
    const daysLeft = getDaysUntilExpiry(activePayment.expiresAt);
    if (daysLeft <= 30) {
      notifications.push({
        id: '1',
        title: 'To\'lov eslatmasi',
        message: `To'lov muddati tugashiga ${daysLeft} kun qoldi`,
        type: daysLeft <= 7 ? 'warning' : 'info',
        date: activePayment.expiresAt,
      });
    }
  } else {
    notifications.push({
      id: '2',
      title: 'To\'lov kerak',
      message: 'Kurslardan foydalanish uchun to\'lov qiling',
      type: 'warning',
      date: new Date().toISOString().split('T')[0],
    });
  }

  const hasUnread = notifications.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Bildirishnomalar</h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={cn(
                  "p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors",
                  notif.type === 'warning' && "bg-warning/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    notif.type === 'warning' ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                  )}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.date)}</p>
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
  );
}
