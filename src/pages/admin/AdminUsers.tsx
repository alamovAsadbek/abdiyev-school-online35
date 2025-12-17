import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Ban, CheckCircle2, Phone } from 'lucide-react';
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
import { usersApi, authApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate } from "@/data/demoData";

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [blockUserId, setBlockUserId] = useState<string | null>(null);
  const [unblockUserId, setUnblockUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getAll({ role: 'student' });
      const data = response?.results || response || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Xatolik',
        description: 'Foydalanuvchilarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({ username: '', first_name: '', last_name: '', phone: '', password: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.first_name.trim()) {
      toast({ title: 'Xatolik', description: 'Username va ism to\'ldiring', variant: 'destructive' });
      return;
    }

    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
        });
        toast({ title: 'Muvaffaqiyat', description: 'Foydalanuvchi yangilandi' });
      } else {
        if (!formData.password) {
          toast({ title: 'Xatolik', description: 'Parol kiriting', variant: 'destructive' });
          return;
        }
        await authApi.register(formData.username, formData.password, formData.first_name, formData.last_name);
        toast({ title: 'Muvaffaqiyat', description: 'Yangi foydalanuvchi qo\'shildi' });
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error?.response?.data?.message || 'Saqlashda xatolik',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (deleteUserId) {
      try {
        await usersApi.delete(deleteUserId);
        setUsers(prev => prev.filter(u => u.id !== deleteUserId));
        toast({ title: 'O\'chirildi', description: 'Foydalanuvchi o\'chirildi' });
      } catch (error) {
        toast({ title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive' });
      } finally {
        setDeleteUserId(null);
      }
    }
  };

  const handleBlock = async () => {
    if (blockUserId) {
      try {
        await usersApi.block(blockUserId);
        setUsers(prev => prev.map(u => u.id === blockUserId ? { ...u, is_blocked: true } : u));
        toast({ title: 'Bloklandi', description: 'Foydalanuvchi bloklandi' });
      } catch (error) {
        toast({ title: 'Xatolik', description: 'Bloklashda xatolik', variant: 'destructive' });
      } finally {
        setBlockUserId(null);
      }
    }
  };

  const handleUnblock = async () => {
    if (unblockUserId) {
      try {
        await usersApi.unblock(unblockUserId);
        setUsers(prev => prev.map(u => u.id === unblockUserId ? { ...u, is_blocked: false } : u));
        toast({ title: 'Blok olib tashlandi', description: 'Foydalanuvchi faollashtirildi' });
      } catch (error) {
        toast({ title: 'Xatolik', description: 'Blokni olib tashlashda xatolik', variant: 'destructive' });
      } finally {
        setUnblockUserId(null);
      }
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Foydalanuvchi',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full font-semibold",
            user.is_blocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {user.first_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-card-foreground">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
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
      key: 'created_at',
      header: 'Ro\'yxatdan o\'tgan',
      sortable: true,
      render: (user) => formatDate(user.created_at),
    },
    {
      key: 'is_blocked',
      header: 'Holat',
      render: (user) => (
        <span className={cn(
          "status-badge",
          user.is_blocked ? "bg-destructive/15 text-destructive" : "status-completed"
        )}>
          {user.is_blocked ? 'Bloklangan' : 'Faol'}
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
            onClick={() => user.is_blocked ? setUnblockUserId(user.id) : setBlockUserId(user.id)}
            className={cn(
              "h-8 w-8",
              user.is_blocked
                ? "text-success hover:text-success"
                : "text-warning hover:text-warning"
            )}
          >
            {user.is_blocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
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
      key: 'is_blocked',
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Ism</Label>
                  <Input
                    id="first_name"
                    placeholder="Ism"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Familiya</Label>
                  <Input
                    id="last_name"
                    placeholder="Familiya"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
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
          searchPlaceholder="Ism yoki username bo'yicha qidirish..."
          searchKeys={['first_name', 'last_name', 'username', 'phone']}
          onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
          emptyMessage={loading ? "Yuklanmoqda..." : "Foydalanuvchilar topilmadi"}
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

      {/* Block Confirmation */}
      <ConfirmDialog
        open={!!blockUserId}
        onOpenChange={(open) => !open && setBlockUserId(null)}
        title="Foydalanuvchini bloklash"
        description="Rostdan ham bu foydalanuvchini bloklashni xohlaysizmi?"
        confirmText="Ha, bloklash"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={handleBlock}
      />

      {/* Unblock Confirmation */}
      <ConfirmDialog
        open={!!unblockUserId}
        onOpenChange={(open) => !open && setUnblockUserId(null)}
        title="Blokni olib tashlash"
        description="Foydalanuvchi blokdan chiqarilsinmi?"
        confirmText="Ha, faollashtirish"
        cancelText="Bekor qilish"
        onConfirm={handleUnblock}
      />
    </DashboardLayout>
  );
}
