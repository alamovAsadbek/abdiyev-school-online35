import { useNavigate } from 'react-router-dom';
import { Video, FolderOpen, ClipboardList, Users, TrendingUp, Eye, Bell, Send } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { demoVideos, demoCategories, demoTasks, demoUsers } from '@/data/demoData';
import { useState } from 'react';
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    recipient: 'all',
    title: '',
    message: '',
    type: 'system' as 'payment' | 'course' | 'system',
  });

  const students = demoUsers.filter(u => u.role === 'student');

  const handleSendNotification = () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast.error('Sarlavha va xabar kiritilishi shart');
      return;
    }

    // In real app, this would send to backend
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
  };

  const recentActivity = [
    { type: 'video', title: 'Atom tuzilishi', action: 'ko\'rildi', user: 'Aziz Karimov', time: '5 daqiqa oldin' },
    { type: 'task', title: 'Davriy jadval testi', action: 'bajarildi', user: 'Malika Rahimova', time: '15 daqiqa oldin' },
    { type: 'video', title: 'Alkanlar', action: 'ko\'rildi', user: 'Aziz Karimov', time: '1 soat oldin' },
    { type: 'task', title: 'Atom tuzilishi testi', action: 'bajarildi', user: 'Aziz Karimov', time: '2 soat oldin' },
  ];

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
            value={demoCategories.length}
            color="primary"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <StatCard
            icon={Video}
            label="Video darslar"
            value={demoVideos.length}
            color="accent"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            icon={ClipboardList}
            label="Vazifalar"
            value={demoTasks.length}
            color="success"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <StatCard
            icon={Users}
            label="O'quvchilar"
            value={students.length}
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
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Turi</Label>
                <Select
                  value={notificationForm.type}
                  onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, type: value }))}
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
                <Button onClick={handleSendNotification} className="gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4 mr-2" />
                  Yuborish
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Activity */}
      <div className="animate-fade-in rounded-xl border border-border bg-card p-6" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-lg font-semibold text-card-foreground mb-4">So'nggi faoliyat</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                activity.type === 'video' ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'
              }`}>
                {activity.type === 'video' ? <Eye className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-card-foreground truncate">
                  {activity.user} - {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
