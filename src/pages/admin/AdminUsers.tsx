import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Ban, CheckCircle2, Mail, Phone } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { demoUsers, User, formatDate } from '@/data/demoData';
import { cn } from '@/lib/utils';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(demoUsers.filter(u => u.role === 'student'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', phone: '', password: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: 'Xatolik', description: 'Ism va email to\'ldiring', variant: 'destructive' });
      return;
    }

    if (editingUser) {
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, name: formData.name, email: formData.email, phone: formData.phone }
          : u
      ));
      toast({ title: 'Muvaffaqiyat', description: 'Foydalanuvchi yangilandi' });
    } else {
      if (!formData.password) {
        toast({ title: 'Xatolik', description: 'Parol kiriting', variant: 'destructive' });
        return;
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'student',
        createdAt: new Date().toISOString().split('T')[0],
        isBlocked: false,
      };
      setUsers(prev => [...prev, newUser]);
      toast({ title: 'Muvaffaqiyat', description: 'Yangi foydalanuvchi qo\'shildi' });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteUserId) {
      setUsers(prev => prev.filter(u => u.id !== deleteUserId));
      toast({ title: 'O\'chirildi', description: 'Foydalanuvchi o\'chirildi' });
      setDeleteUserId(null);
    }
  };

  const handleToggleBlock = (userId: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u
    ));
    const user = users.find(u => u.id === userId);
    toast({
      title: user?.isBlocked ? 'Blok olib tashlandi' : 'Bloklandi',
      description: user?.isBlocked ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi bloklandi',
    });
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Foydalanuvchi',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full font-semibold",
            user.isBlocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-card-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telefon',
      render: (user) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          {user.phone || '-'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ro\'yxatdan o\'tgan',
      sortable: true,
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: 'isBlocked',
      header: 'Holat',
      render: (user) => (
        <span className={cn(
          "status-badge",
          user.isBlocked ? "bg-destructive/15 text-destructive" : "status-completed"
        )}>
          {user.isBlocked ? 'Bloklangan' : 'Faol'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      render: (user) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog(user)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleBlock(user.id)}
            className={cn(
              "h-8 w-8",
              user.isBlocked
                ? "text-success hover:text-success"
                : "text-warning hover:text-warning"
            )}
          >
            {user.isBlocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteUserId(user.id)}
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
      key: 'isBlocked',
      label: 'Holat',
      options: [
        { value: 'false', label: 'Faol' },
        { value: 'true', label: 'Bloklangan' },
      ],
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Foydalanuvchilar
          </h1>
          <p className="text-muted-foreground">
            O'quvchilarni boshqaring
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Yangi o'quvchi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'O\'quvchini tahrirlash' : 'Yangi o\'quvchi'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ism familiya</Label>
                <Input
                  id="name"
                  placeholder="Ism familiya"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  placeholder="+998901234567"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Parol</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Bekor qilish</Button>
                <Button onClick={handleSave} className="gradient-primary text-primary-foreground">Saqlash</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={users}
          columns={columns}
          filters={filters}
          searchPlaceholder="Ism yoki email bo'yicha qidirish..."
          searchKeys={['name', 'email', 'phone']}
          onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
          emptyMessage="Foydalanuvchilar topilmadi"
        />
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni qaytarib bo'lmaydi. Foydalanuvchi va unga tegishli barcha ma'lumotlar o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
