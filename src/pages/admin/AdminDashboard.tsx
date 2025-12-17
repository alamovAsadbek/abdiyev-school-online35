import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, FolderOpen, ClipboardList, Users, TrendingUp, Eye, Bell, Send } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { categoriesApi, videosApi, tasksApi, usersApi, notificationsApi } from '@/services/api';

interface DashboardStats {
  categoriesCount: number;
  videosCount: number;
  tasksCount: number;
  studentsCount: number;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    categoriesCount: 0,
    videosCount: 0,
    tasksCount: 0,
    studentsCount: 0,
  });
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    recipient: 'all',
    title: '',
    message: '',
    type: 'system',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [categoriesRes, videosRes, tasksRes, usersRes] = await Promise.all([
        categoriesApi.getAll(),
        videosApi.getAll(),
        tasksApi.getAll(),
        usersApi.getAll({ role: 'student' }),
      ]);

      const categories = categoriesRes?.results || categoriesRes || [];
      const videos = videosRes?.results || videosRes || [];
      const tasks = tasksRes?.results || tasksRes || [];
      const users = usersRes?.results || usersRes || [];

      setStats({
        categoriesCount: Array.isArray(categories) ? categories.length : 0,
        videosCount: Array.isArray(videos) ? videos.length : 0,
        tasksCount: Array.isArray(tasks) ? tasks.length : 0,
        studentsCount: Array.isArray(users) ? users.length : 0,
      });
      setStudents(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast.error('Sarlavha va xabar kiritilishi shart');
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
      };

      if (notificationForm.recipient === 'all') {
        payload.send_to_all = true;
      } else {
        payload.user_ids = [notificationForm.recipient];
      }

      await notificationsApi.send(payload);
      
      toast.success(
        notificationForm.recipient === 'all' 
          ? `Xabarnoma barcha ${students.length} ta o'quvchiga yuborildi` 
          : 'Xabarnoma yuborildi'
      );
      
      setIsNotificationDialogOpen(false);
      setNotificationForm({
        recipient: 'all',
        title: '',
        message: '',
        type: 'system',
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Xabarnomani yuborishda xatolik');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Xush kelibsiz, {user?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <StatCard
            icon={FolderOpen}
            label="Kategoriyalar"
            value={loading ? '...' : stats.categoriesCount}
            color="primary"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <StatCard
            icon={Video}
            label="Video darslar"
            value={loading ? '...' : stats.videosCount}
            color="accent"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            icon={ClipboardList}
            label="Vazifalar"
            value={loading ? '...' : stats.tasksCount}
            color="success"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <StatCard
            icon={Users}
            label="O'quvchilar"
            value={loading ? '...' : stats.studentsCount}
            color="warning"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/categories')}
          className="animate-fade-in p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left group"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Kategoriya qo'shish</h3>
              <p className="text-sm text-muted-foreground">Yangi bo'lim yaratish</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/videos')}
          className="animate-fade-in p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left group"
          style={{ animationDelay: '0.35s' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Video yuklash</h3>
              <p className="text-sm text-muted-foreground">Yangi dars qo'shish</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/tasks')}
          className="animate-fade-in p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left group"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Vazifa qo'shish</h3>
              <p className="text-sm text-muted-foreground">Test savollari yaratish</p>
            </div>
          </div>
        </button>

        <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="animate-fade-in p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left group"
              style={{ animationDelay: '0.45s' }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Xabarnoma yuborish</h3>
                  <p className="text-sm text-muted-foreground">O'quvchilarga bildirishnoma</p>
                </div>
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Xabarnoma yuborish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Qabul qiluvchi</Label>
                <Select
                  value={notificationForm.recipient}
                  onValueChange={(value) => setNotificationForm(prev => ({ ...prev, recipient: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha o'quvchilar ({students.length} ta)</SelectItem>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} (@{student.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Turi</Label>
                <Select
                  value={notificationForm.type}
                  onValueChange={(value) => setNotificationForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Tizim xabari</SelectItem>
                    <SelectItem value="course">Kurs haqida</SelectItem>
                    <SelectItem value="payment">To'lov haqida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notif-title">Sarlavha</Label>
                <Input
                  id="notif-title"
                  placeholder="Xabar sarlavhasi"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notif-message">Xabar matni</Label>
                <Textarea
                  id="notif-message"
                  placeholder="Xabar matnini kiriting..."
                  rows={4}
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsNotificationDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button 
                  onClick={handleSendNotification} 
                  className="gradient-primary text-primary-foreground"
                  disabled={sending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Yuborilmoqda...' : 'Yuborish'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <div className="animate-fade-in rounded-xl border border-border bg-card p-6" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Tizim haqida</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Jami kurslar</p>
            <p className="text-2xl font-bold text-foreground">{stats.categoriesCount}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Jami videolar</p>
            <p className="text-2xl font-bold text-foreground">{stats.videosCount}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Faol o'quvchilar</p>
            <p className="text-2xl font-bold text-foreground">{stats.studentsCount}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
