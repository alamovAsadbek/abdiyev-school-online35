import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, Ban, CheckCircle2, Gift, Plus, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  demoUsers,
  demoPayments,
  demoUserCourses,
  demoCategories,
  getUserById,
  getCategoryById,
  formatDate,
  formatCurrency,
  Payment,
  UserCourse,
} from '@/data/demoData';
import { cn } from '@/lib/utils';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const user = getUserById(userId || '');
  const [payments, setPayments] = useState<Payment[]>(demoPayments.filter(p => p.odId === userId));
  const [courses, setCourses] = useState<UserCourse[]>(demoUserCourses.filter(uc => uc.odId === userId));
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', expiresAt: '', description: '' });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  // Confirmation dialog states
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground mb-4">Foydalanuvchi topilmadi</p>
          <Button onClick={() => navigate('/admin/users')}>Orqaga qaytish</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleAddPayment = () => {
    if (!paymentForm.amount || !paymentForm.expiresAt) {
      toast({ title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring', variant: 'destructive' });
      return;
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      odId: user.id,
      amount: parseInt(paymentForm.amount),
      expiresAt: paymentForm.expiresAt,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      description: paymentForm.description,
    };
    setPayments(prev => [newPayment, ...prev]);
    setIsPaymentDialogOpen(false);
    setPaymentForm({ amount: '', expiresAt: '', description: '' });
    toast({ title: 'Muvaffaqiyat', description: 'To\'lov qo\'shildi' });
  };

  const handleGiftCourse = () => {
    if (!selectedCategoryId) {
      toast({ title: 'Xatolik', description: 'Kursni tanlang', variant: 'destructive' });
      return;
    }

    const exists = courses.find(c => c.categoryId === selectedCategoryId);
    if (exists) {
      toast({ title: 'Xatolik', description: 'Bu kurs allaqachon mavjud', variant: 'destructive' });
      return;
    }

    const newCourse: UserCourse = {
      id: `uc-${Date.now()}`,
      odId: user.id,
      categoryId: selectedCategoryId,
      grantedAt: new Date().toISOString().split('T')[0],
      grantedBy: 'gift',
    };
    setCourses(prev => [newCourse, ...prev]);
    setIsCourseDialogOpen(false);
    setSelectedCategoryId('');
    toast({ title: 'Muvaffaqiyat', description: 'Kurs sovg\'a qilindi' });
  };

  const handleRemoveCourse = () => {
    if (courseToDelete) {
      setCourses(prev => prev.filter(c => c.id !== courseToDelete));
      setCourseToDelete(null);
      toast({ title: 'O\'chirildi', description: 'Kurs olib tashlandi' });
    }
  };

  const handleRemovePayment = () => {
    if (paymentToDelete) {
      setPayments(prev => prev.filter(p => p.id !== paymentToDelete));
      setPaymentToDelete(null);
      toast({ title: 'O\'chirildi', description: 'To\'lov olib tashlandi' });
    }
  };

  const handleBlockToggle = () => {
    user.isBlocked = !user.isBlocked;
    setShowBlockConfirm(false);
    toast({ 
      title: user.isBlocked ? 'Bloklandi' : 'Faollashtirildi', 
      description: user.isBlocked ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi' 
    });
  };

  return (
    <DashboardLayout>
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/admin/users')} className="mb-6 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Orqaga
      </Button>

      {/* User Info Card */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className={cn(
            "flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold",
            user.isBlocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <span className={cn(
                "status-badge",
                user.isBlocked ? "bg-destructive/15 text-destructive" : "status-completed"
              )}>
                {user.isBlocked ? 'Bloklangan' : 'Faol'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(user.createdAt)}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowBlockConfirm(true)}
            className={user.isBlocked ? "text-success border-success hover:bg-success/10" : "text-warning border-warning hover:bg-warning/10"}
          >
            {user.isBlocked ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
            {user.isBlocked ? 'Faollashtirish' : 'Bloklash'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <TabsList className="mb-6">
          <TabsTrigger value="courses">Kurslar ({courses.length})</TabsTrigger>
          <TabsTrigger value="payments">To'lovlar ({payments.length})</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsCourseDialogOpen(true)} className="gradient-primary text-primary-foreground">
              <Gift className="mr-2 h-4 w-4" />
              Kurs sovg'a qilish
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Kurs</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Berilgan sana</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Turi</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {courses.length > 0 ? courses.map(course => {
                  const category = getCategoryById(course.categoryId);
                  return (
                    <tr key={course.id} className="border-b border-border last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category?.icon}</span>
                          <span className="font-medium">{category?.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatDate(course.grantedAt)}</td>
                      <td className="p-4">
                        <span className={cn(
                          "status-badge",
                          course.grantedBy === 'gift' ? "bg-accent/15 text-accent" : "status-completed"
                        )}>
                          {course.grantedBy === 'gift' ? 'Sovg\'a' : 'To\'lov'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCourseToDelete(course.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Kurslar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsPaymentDialogOpen(true)} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              To'lov qo'shish
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Summa</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tavsif</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Sana</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amal qilish muddati</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Holat</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? payments.map(payment => (
                  <tr key={payment.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-semibold text-foreground">{formatCurrency(payment.amount)}</td>
                    <td className="p-4 text-muted-foreground">{payment.description || '-'}</td>
                    <td className="p-4 text-muted-foreground">{formatDate(payment.createdAt)}</td>
                    <td className="p-4 text-muted-foreground">{formatDate(payment.expiresAt)}</td>
                    <td className="p-4">
                      <span className={cn(
                        "status-badge",
                        payment.status === 'active' ? "status-completed" : "bg-destructive/15 text-destructive"
                      )}>
                        {payment.status === 'active' ? 'Faol' : 'Tugagan'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPaymentToDelete(payment.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      To'lovlar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Gift Course Dialog */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kurs sovg'a qilish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Kursni tanlang</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kurs tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {demoCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)}>Bekor qilish</Button>
              <Button onClick={handleGiftCourse} className="gradient-primary text-primary-foreground">
                <Gift className="mr-2 h-4 w-4" />
                Sovg'a qilish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To'lov qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Summa (so'm)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="500000"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Amal qilish muddati</Label>
              <Input
                id="expiresAt"
                type="date"
                value={paymentForm.expiresAt}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Input
                id="description"
                placeholder="1 oylik obuna"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Bekor qilish</Button>
              <Button onClick={handleAddPayment} className="gradient-primary text-primary-foreground">Saqlash</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation */}
      <ConfirmDialog
        open={!!courseToDelete}
        onOpenChange={(open) => !open && setCourseToDelete(null)}
        title="Kursni o'chirish"
        description="Rostdan ham bu kursni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={handleRemoveCourse}
      />

      {/* Delete Payment Confirmation */}
      <ConfirmDialog
        open={!!paymentToDelete}
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
        title="To'lovni o'chirish"
        description="Rostdan ham bu to'lovni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={handleRemovePayment}
      />

      {/* Block/Unblock Confirmation */}
      <ConfirmDialog
        open={showBlockConfirm}
        onOpenChange={setShowBlockConfirm}
        title={user.isBlocked ? "Foydalanuvchini faollashtirish" : "Foydalanuvchini bloklash"}
        description={user.isBlocked 
          ? "Rostdan ham bu foydalanuvchini faollashtirishni xohlaysizmi? U yana tizimdan foydalana oladi." 
          : "Rostdan ham bu foydalanuvchini bloklashni xohlaysizmi? U tizimdan foydalana olmaydi."}
        confirmText={user.isBlocked ? "Ha, faollashtirish" : "Ha, bloklash"}
        cancelText="Bekor qilish"
        variant={user.isBlocked ? "default" : "destructive"}
        onConfirm={handleBlockToggle}
      />
    </DashboardLayout>
  );
}
