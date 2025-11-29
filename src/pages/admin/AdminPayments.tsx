import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, User, Calendar, CreditCard } from 'lucide-react';
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
import {
  demoPayments,
  demoUsers,
  Payment,
  getUserById,
  formatDate,
  formatCurrency,
  getDaysUntilExpiry,
} from '@/data/demoData';
import { cn } from '@/lib/utils';

export default function AdminPayments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const students = demoUsers.filter(u => u.role === 'student');
  const [payments, setPayments] = useState<Payment[]>(demoPayments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    odId: '',
    amount: '',
    createdAt: new Date().toISOString().split('T')[0],
    durationDays: '30',
    expiresAt: '',
    description: '',
  });

  const calculateExpiryDate = (startDate: string, days: number): string => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const handleDurationChange = (days: string) => {
    setFormData(prev => {
      const daysNum = parseInt(days) || 0;
      const expiresAt = calculateExpiryDate(prev.createdAt, daysNum);
      return { ...prev, durationDays: days, expiresAt };
    });
  };

  const handleCreatedAtChange = (date: string) => {
    setFormData(prev => {
      const daysNum = parseInt(prev.durationDays) || 0;
      const expiresAt = calculateExpiryDate(date, daysNum);
      return { ...prev, createdAt: date, expiresAt };
    });
  };

  const handleOpenDialog = (payment?: Payment) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (payment) {
      setEditingPayment(payment);
      const createdDate = new Date(payment.createdAt);
      const expiryDate = new Date(payment.expiresAt);
      const daysDiff = Math.round((expiryDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      setFormData({
        odId: payment.odId,
        amount: payment.amount.toString(),
        createdAt: payment.createdAt,
        durationDays: daysDiff.toString(),
        expiresAt: payment.expiresAt,
        description: payment.description || '',
      });
    } else {
      setEditingPayment(null);
      const expiresAt = calculateExpiryDate(today, 30);
      setFormData({ 
        odId: '', 
        amount: '', 
        createdAt: today,
        durationDays: '30',
        expiresAt,
        description: '' 
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.odId || !formData.amount || !formData.createdAt || !formData.expiresAt) {
      toast({ title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring', variant: 'destructive' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const status = formData.expiresAt >= today ? 'active' : 'expired';

    if (editingPayment) {
      setPayments(prev => prev.map(p =>
        p.id === editingPayment.id
          ? { 
              ...p, 
              odId: formData.odId,
              amount: parseInt(formData.amount), 
              createdAt: formData.createdAt,
              expiresAt: formData.expiresAt,
              status,
              description: formData.description 
            }
          : p
      ));
      toast({ title: 'Muvaffaqiyat', description: 'To\'lov yangilandi' });
    } else {
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        odId: formData.odId,
        amount: parseInt(formData.amount),
        expiresAt: formData.expiresAt,
        createdAt: formData.createdAt,
        status,
        description: formData.description,
      };
      setPayments(prev => [newPayment, ...prev]);
      toast({ title: 'Muvaffaqiyat', description: 'To\'lov qo\'shildi' });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    toast({ title: 'O\'chirildi', description: 'To\'lov o\'chirildi' });
  };

  const columns: Column<Payment>[] = [
    {
      key: 'user',
      header: 'O\'quvchi',
      render: (payment) => {
        const user = getUserById(payment.odId);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {user?.name.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-medium text-card-foreground">{user?.name || 'Noma\'lum'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        );
      },
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
      key: 'createdAt',
      header: 'Sana',
      sortable: true,
      render: (payment) => formatDate(payment.createdAt),
    },
    {
      key: 'expiresAt',
      header: 'Amal qilish muddati',
      sortable: true,
      render: (payment) => {
        const days = getDaysUntilExpiry(payment.expiresAt);
        return (
          <div>
            <p>{formatDate(payment.expiresAt)}</p>
            {payment.status === 'active' && days <= 7 && (
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
            onClick={() => handleDelete(payment.id)}
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
                  value={formData.odId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, odId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="O'quvchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.email})
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
                <Label htmlFor="createdAt">To'lov qabul qilingan sana</Label>
                <Input
                  id="createdAt"
                  type="date"
                  value={formData.createdAt}
                  onChange={(e) => handleCreatedAtChange(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="durationDays">Muddat (kunlar)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  placeholder="30"
                  value={formData.durationDays}
                  onChange={(e) => handleDurationChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  To'lov sanasidan boshlab necha kun faol bo'lishi
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Amal qilish muddati (tugash sanasi)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Avtomatik hisoblanadi, xohlovingizcha o'zgartirishingiz mumkin
                </p>
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
          emptyMessage="To'lovlar topilmadi"
        />
      </div>
    </DashboardLayout>
  );
}
