import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UserNotification {
  id: string;
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
  };
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      fetchUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user && user.role !== 'admin') {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response?.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getMyNotifications();
      const notifs = response?.results || response || [];
      setNotifications(Array.isArray(notifs) ? notifs : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: 'Xatolik',
        description: 'Bildirishnomalarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({
        title: 'Muvaffaqiyat',
        description: 'Barcha bildirishnomalar o\'qilgan deb belgilandi',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-warning/20 text-warning';
      case 'course':
        return 'bg-primary/20 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!user || user.role === 'admin') return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Bildirishnomalar</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={handleMarkAllRead}
            >
              Barchasini o'qish
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Yuklanmoqda...
            </div>
          ) : notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={cn(
                  "p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                  !notif.is_read && "bg-primary/5"
                )}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                    getTypeStyles(notif.notification.type)
                  )}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notif.notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
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
