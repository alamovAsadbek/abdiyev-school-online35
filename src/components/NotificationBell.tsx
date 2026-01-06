import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

interface UserNotification {
  id: string;
  notification: Notification;
  is_read: boolean;
  received_at: string;
}

// Notification sound as base64 (short beep sound)
const NOTIFICATION_SOUND_BASE64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQgdWI+u0L55ExdJfKTLy4k5CyRjrbvPn1w0I06KxdSzZxoKS3ek0s+EWAUKV4i11MQAAAB/gYB9e32JpL+2h1IxNVaAvtfRoVwMJV6bztyxZhAZUouz0sFzCBVJhbDTv3gJEVGDr9DAfQsPUIOvz8B9Cw9Qg6/PwH0LD1CDr8/AfQsPUIOvz8B9Cw9Qg6/PwH0LD1CDr8/AfQsPUIOvz8B9Cw9Qg6/PwH0LD1CDr8/AfQsPUIOvz8B9Cw9Qg6/PwH0LD1CDr8/AfQsPUIOvz8B9Cw9Qg6/PwH0=';

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const previousUnreadCount = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedInitialSound = useRef(false);

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_BASE64);
    audioRef.current.volume = 0.5;
    
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || user.role === 'admin') return;
    
    try {
      const response = await notificationsApi.getUnreadCount();
      const newCount = response?.count || response?.unread_count || 0;
      
      // Check if there are new notifications
      if (initialLoaded && newCount > previousUnreadCount.current) {
        // New notification arrived! Play sound
        playNotificationSound();
        
        // Show toast notification
        toast({
          title: '🔔 Yangi xabarnoma!',
          description: 'Sizga yangi xabarnoma keldi',
        });
      }
      
      previousUnreadCount.current = newCount;
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [user, initialLoaded, playNotificationSound, toast]);

  const fetchNotifications = useCallback(async () => {
    if (!user || user.role === 'admin') return;
    
    setLoading(true);
    try {
      const response = await notificationsApi.getMyNotifications();
      let notifs = [];
      
      if (Array.isArray(response)) {
        notifs = response;
      } else if (response?.results && Array.isArray(response.results)) {
        notifs = response.results;
      }
      
      setNotifications(notifs);
      
      // Update unread count
      const unread = notifs.filter((n: UserNotification) => !n.is_read).length;
      
      // Play sound on first load if there are unread notifications
      if (!hasPlayedInitialSound.current && unread > 0) {
        playNotificationSound();
        hasPlayedInitialSound.current = true;
      }
      
      previousUnreadCount.current = unread;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [user, playNotificationSound]);

  // Initial fetch
  useEffect(() => {
    if (user && user.role !== 'admin' && !initialLoaded) {
      fetchNotifications();
    }
  }, [user, fetchNotifications, initialLoaded]);

  // Fetch notifications when popover opens
  useEffect(() => {
    if (isOpen && user && user.role !== 'admin') {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications, user]);

  // Poll for new notifications every 15 seconds
  useEffect(() => {
    if (!user || user.role === 'admin') return;
    
    const interval = setInterval(() => {
      if (!isOpen) {
        fetchUnreadCount();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [user, isOpen, fetchUnreadCount]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      previousUnreadCount.current = Math.max(0, previousUnreadCount.current - 1);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast({
        title: 'Xatolik',
        description: 'Bildirishnomani o\'qilgan deb belgilashda xatolik',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      previousUnreadCount.current = 0;
      toast({
        title: 'Muvaffaqiyat',
        description: 'Barcha bildirishnomalar o\'qilgan deb belgilandi',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast({
        title: 'Xatolik',
        description: 'Xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Hozirgina';
      if (diffMins < 60) return `${diffMins} daqiqa oldin`;
      if (diffHours < 24) return `${diffHours} soat oldin`;
      if (diffDays < 7) return `${diffDays} kun oldin`;
      
      return date.toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-warning/20 text-warning';
      case 'course':
        return 'bg-primary/20 text-primary';
      case 'system':
      case 'info':
        return 'bg-muted text-muted-foreground';
      case 'success':
        return 'bg-green-500/20 text-green-500';
      case 'warning':
        return 'bg-warning/20 text-warning';
      case 'error':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };


  // Don't render for admins
  if (!user || user.role === 'admin') return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Bildirishnomalar"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <h3 className="font-semibold text-foreground">Bildirishnomalar</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 hover:bg-primary/10"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Barchasini o'qish
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[350px]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground text-sm mt-2">Yuklanmoqda...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    !notif.is_read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                      getTypeStyles(notif.notification?.type || 'info')
                    )}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-foreground line-clamp-1">
                          {notif.notification?.title || 'Bildirishnoma'}
                        </p>
                        {!notif.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 hover:bg-primary/20"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            title="O'qilgan deb belgilash"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.notification?.message || ''}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDate(notif.received_at)}
                      </p>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Yangi bildirishnomalar yo'q
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
