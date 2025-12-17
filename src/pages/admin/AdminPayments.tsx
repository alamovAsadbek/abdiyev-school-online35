import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column, Filter } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { paymentsApi, usersApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Payment {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  amount: number;
  description: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

export default function AdminPayments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    created_at: new Date().toISOString().split('T')[0],
    duration_days: '30',
    expires_at: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, usersRes] = await Promise.all([
        paymentsApi.getAll(),
        usersApi.getAll({ role: 'student' }),
      ]);

      const paymentsData = paymentsRes?.results || paymentsRes || [];
      const usersData = usersRes?.results || usersRes || [];

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setStudents(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Xatolik',
        description: 'Ma\'lumotlarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateExpiryDate = (startDate: string, days: number): string => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const handleDurationChange = (days: string) => {
    setFormData(prev => {
      const daysNum = parseInt(days) || 0;
      const expires_at = calculateExpiryDate(prev.created_at, daysNum);
      return { ...prev, duration_days: days, expires_at };
    });
  };

  const handleCreatedAtChange = (date: string) => {
    setFormData(prev => {
      const daysNum = parseInt(prev.duration_days) || 0;
      const expires_at = calculateExpiryDate(date, daysNum);
      return { ...prev, created_at: date, expires_at };
    });
  };

  const handleOpenDialog = (payment?: Payment) => {
    const today = new Date().toISOString().split('T')[0];

    if (payment) {
      setEditingPayment(payment);
      const createdDate = new Date(payment.created_at);
      const expiryDate = new Date(payment.expires_at);
      const daysDiff = Math.round((expiryDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      setFormData({
        user_id: payment.user.id,
        amount: payment.amount.toString(),
        created_at: payment.created_at.split('T')[0],
        duration_days: daysDiff.toString(),
        expires_at: payment.expires_at.split('T')[0],
        description: payment.description || '',
      });
    } else {
      setEditingPayment(null);
      const expires_at = calculateExpiryDate(today, 30);
      setFormData({
        user_id: '',
        amount: '',
        created_at: today,
        duration_days: '30',
        expires_at,
        description: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.user_id || !formData.amount || !formData.created_at || !formData.expires_at) {
      toast({ title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        user_id: formData.user_id,
        amount: parseInt(formData.amount),
        created_at: formData.created_at,
        expires_at: formData.expires_at,
        description: formData.description,
      };

      if (editingPayment) {
        await paymentsApi.update(editingPayment.id, payload);
        toast({ title: 'Muvaffaqiyat', description: 'To\'lov yangilandi' });
      } else {
        await paymentsApi.create(payload);
        toast({ title: 'Muvaffaqiyat', description: 'To\'lov qo\'shildi' });
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Saqlashda xatolik',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (paymentToDelete) {
      try {
        await paymentsApi.delete(paymentToDelete);
        setPayments(prev => prev.filter(p => p.id !== paymentToDelete));
        toast({ title: 'O\'chirildi', description: 'To\'lov o\'chirildi' });
      } catch (error) {
        toast({
          title: 'Xatolik',
          description: 'O\'chirishda xatolik',
          variant: 'destructive',
        });
      } finally {
        setPaymentToDelete(null);
      }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const today = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const columns: Column<Payment>[] = [
    {
      key: 'user',
      header: 'O\'quvchi',
      render: (payment) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
            {payment.user?.first_name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium text-card-foreground">
              {payment.user?.first_name} {payment.user?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">@{payment.user?.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Summa',
      sortable: true,
      render: (payment) => (
        <span className="font-semibold text-foreground">{formatCurrency(payment.amount)}</span>
      ),
    },
    {
      key: 'description',
      header: 'Tavsif',
      render: (payment) => payment.description || '-',
    },
    {
      key: 'created_at',
      header: 'Sana',
      sortable: true,
      render: (payment) => formatDate(payment.created_at),
    },
    {
      key: 'expires_at',
      header: 'Amal qilish muddati',
      sortable: true,
      render: (payment) => {
        const days = getDaysUntilExpiry(payment.expires_at);
        return (
          <div>
            <p>{formatDate(payment.expires_at)}</p>
            {payment.status === 'active' && days <= 7 && days > 0 && (
              <p className="text-xs text-warning">{days} kun qoldi</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Holat',
      render: (payment) => (
        <span className={cn(
          "status-badge",
          payment.status === 'active' ? "status-completed" : "bg-destructive/15 text-destructive"
        )}>
          {payment.status === 'active' ? 'Faol' : 'Tugagan'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      render: (payment) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog(payment)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaymentToDelete(payment.id)}
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
      key: 'status',
      label: 'Holat',
      options: [
        { value: 'active', label: 'Faol' },
        { value: 'expired', label: 'Tugagan' },
      ],
    },
  ];

  // Calculate totals
  const totalActive = payments.filter(p => p.status === 'active').reduce((sum, p) => sum + p.amount, 0);
  const totalAll = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            To'lovlar
          </h1>
          <p className="text-muted-foreground">
            O'quvchilar to'lovlarini boshqaring
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Yangi to'lov
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'To\'lovni tahrirlash' : 'Yangi to\'lov'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>O'quvchi</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="O'quvchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} (@{student.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Summa (so'm)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="500000"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="created_at">To'lov qabul qilingan sana</Label>
                <Input
                  id="created_at"
                  type="date"
                  value={formData.created_at}
                  onChange={(e) => handleCreatedAtChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_days">Muddat (kunlar)</Label>
                <Input
                  id="duration_days"
                  type="number"
                  placeholder="30"
                  value={formData.duration_days}
                  onChange={(e) => handleDurationChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  To'lov sanasidan boshlab necha kun faol bo'lishi
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Amal qilish muddati (tugash sanasi)</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Input
                  id="description"
                  placeholder="1 oylik obuna"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Bekor qilish</Button>
                <Button onClick={handleSave} className="gradient-primary text-primary-foreground">Saqlash</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Jami to'lovlar</p>
          <p className="text-xl font-bold text-foreground">{payments.length} ta</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Faol to'lovlar summasi</p>
          <p className="text-xl font-bold text-success">{formatCurrency(totalActive)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Umumiy summa</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totalAll)}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={payments}
          columns={columns}
          filters={filters}
          searchPlaceholder="O'quvchi yoki tavsif bo'yicha qidirish..."
          searchKeys={['description']}
          onRowClick={(payment) => navigate(`/admin/payments/${payment.id}`)}
          emptyMessage={loading ? "Yuklanmoqda..." : "To'lovlar topilmadi"}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!paymentToDelete}
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
        title="To'lovni o'chirish"
        description="Rostdan ham bu to'lovni o'chirmoqchimisiz?"
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
