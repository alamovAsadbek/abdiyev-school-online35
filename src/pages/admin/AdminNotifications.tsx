import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column, Filter } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate } from '@/data/demoData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'course' | 'system';
  recipients: 'all' | 'active' | 'expired';
  createdAt: string;
  sentCount: number;
}

const demoAdminNotifications: AdminNotification[] = [
  {
    id: 'admin-notif-1',
    title: 'Yangi dars qo\'shildi',
    message: 'Organik Kimyo bo\'limiga 2 ta yangi video dars qo\'shildi. Ko\'ring!',
    type: 'course',
    recipients: 'all',
    createdAt: '2024-11-25',
    sentCount: 45,
  },
  {
    id: 'admin-notif-2',
    title: 'To\'lov eslatmasi',
    message: 'To\'lov muddatingiz tugashiga yaqin. Iltimos, to\'lovni yangilang.',
    type: 'payment',
    recipients: 'active',
    createdAt: '2024-11-20',
    sentCount: 23,
  },
  {
    id: 'admin-notif-3',
    title: 'Tizim yangilanmoqda',
    message: 'Tizim texnik ishlar uchun 2 soat ishlamaydi (20:00-22:00)',
    type: 'system',
    recipients: 'all',
    createdAt: '2024-11-15',
    sentCount: 45,
  },
];

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AdminNotification[]>(demoAdminNotifications);
  const [notifToDelete, setNotifToDelete] = useState<string | null>(null);
  const [viewNotif, setViewNotif] = useState<AdminNotification | null>(null);
  const { toast } = useToast();

  const handleDelete = () => {
    if (notifToDelete) {
      const updated = notifications.filter(n => n.id !== notifToDelete);
      setNotifications(updated);
      setNotifToDelete(null);
      toast({ title: 'O\'chirildi', description: 'Xabarnoma o\'chirildi' });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      payment: { text: 'To\'lov', variant: 'default' as const },
      course: { text: 'Kurs', variant: 'secondary' as const },
      system: { text: 'Tizim', variant: 'outline' as const },
    };
    return labels[type as keyof typeof labels] || { text: type, variant: 'default' as const };
  };

  const getRecipientsLabel = (recipients: string) => {
    const labels = {
      all: 'Hammaga',
      active: 'Faol foydalanuvchilar',
      expired: 'Muddati tugaganlar',
    };
    return labels[recipients as keyof typeof labels] || recipients;
  };

  const columns: Column<AdminNotification>[] = [
    {
      key: 'title',
      header: 'Sarlavha',
      render: (notif) => (
        <div>
          <p className="font-medium text-card-foreground">{notif.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Turi',
      render: (notif) => {
        const { text, variant } = getTypeLabel(notif.type);
        return <Badge variant={variant}>{text}</Badge>;
      },
    },
    {
      key: 'recipients',
      header: 'Qabul qiluvchilar',
      render: (notif) => (
        <span className="text-sm text-muted-foreground">
          {getRecipientsLabel(notif.recipients)}
        </span>
      ),
    },
    {
      key: 'sentCount',
      header: 'Yuborildi',
      sortable: true,
      render: (notif) => (
        <span className="text-sm font-medium">{notif.sentCount} ta</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Sana',
      sortable: true,
      render: (notif) => (
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Calendar className="h-4 w-4" />
          {formatDate(notif.createdAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      render: (notif) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setViewNotif(notif);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setNotifToDelete(notif.id);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filters: Filter[] = [
    {
      key: 'type',
      label: 'Turi',
      options: [
        { value: 'payment', label: 'To\'lov' },
        { value: 'course', label: 'Kurs' },
        { value: 'system', label: 'Tizim' },
      ],
    },
    {
      key: 'recipients',
      label: 'Qabul qiluvchilar',
      options: [
        { value: 'all', label: 'Hammaga' },
        { value: 'active', label: 'Faol foydalanuvchilar' },
        { value: 'expired', label: 'Muddati tugaganlar' },
      ],
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Xabarnomalar
          </h1>
          <p className="text-muted-foreground">
            Yuborilgan xabarnomalarni boshqaring
          </p>
        </div>
        <Button 
          onClick={() => toast({ title: 'Tez kunda', description: 'Bu funksiya tez kunda qo\'shiladi' })} 
          className="gradient-primary text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yangi xabarnoma
        </Button>
      </div>

      {/* Data Table */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={notifications}
          columns={columns}
          filters={filters}
          searchPlaceholder="Xabarnoma nomi bo'yicha qidirish..."
          searchKeys={['title', 'message']}
          onRowClick={(notif) => setViewNotif(notif)}
          emptyMessage="Xabarnomalar topilmadi"
        />
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewNotif} onOpenChange={(open) => !open && setViewNotif(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewNotif?.title}</DialogTitle>
            <DialogDescription>
              {formatDate(viewNotif?.createdAt || '')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Xabar</label>
              <p className="mt-1 text-foreground">{viewNotif?.message}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Turi</label>
                <p className="mt-1">
                  <Badge variant={getTypeLabel(viewNotif?.type || '').variant}>
                    {getTypeLabel(viewNotif?.type || '').text}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Yuborildi</label>
                <p className="mt-1 font-medium">{viewNotif?.sentCount} ta foydalanuvchiga</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Qabul qiluvchilar</label>
              <p className="mt-1">{getRecipientsLabel(viewNotif?.recipients || '')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!notifToDelete}
        onOpenChange={(open) => !open && setNotifToDelete(null)}
        title="Xabarnomani o'chirish"
        description="Rostdan ham bu xabarnomani o'chirmoqchimisiz?"
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
