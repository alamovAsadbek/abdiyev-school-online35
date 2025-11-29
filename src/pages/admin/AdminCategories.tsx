import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Video } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column } from '@/components/DataTable';
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
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { demoCategories, Category, formatDate, formatCurrency } from '@/data/demoData';

const iconOptions = ['⚗️', '🧪', '🔬', '📊', '🧬', '⚛️', '🔥', '💧'];

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '⚗️', price: '' });
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        icon: category.icon,
        price: category.price.toString(),
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '⚗️', price: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Xatolik', description: 'Kategoriya nomini kiriting', variant: 'destructive' });
      return;
    }

    if (editingCategory) {
      setCategories(prev => prev.map(c =>
        c.id === editingCategory.id
          ? { ...c, name: formData.name, description: formData.description, icon: formData.icon, price: parseInt(formData.price) || 0 }
          : c
      ));
      toast({ title: 'Muvaffaqiyat', description: 'Kategoriya yangilandi' });
    } else {
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: 'primary',
        videoCount: 0,
        price: parseInt(formData.price) || 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCategories(prev => [...prev, newCategory]);
      toast({ title: 'Muvaffaqiyat', description: 'Yangi kategoriya qo\'shildi' });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (categoryToDelete) {
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete));
      setCategoryToDelete(null);
      toast({ title: 'O\'chirildi', description: 'Kategoriya o\'chirildi' });
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Kategoriya',
      render: (category) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
            {category.icon}
          </div>
          <div>
            <p className="font-medium text-card-foreground">{category.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'videoCount',
      header: 'Videolar',
      sortable: true,
      render: (category) => (
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          {category.videoCount} ta
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Narxi',
      sortable: true,
      render: (category) => formatCurrency(category.price),
    },
    {
      key: 'createdAt',
      header: 'Yaratilgan',
      sortable: true,
      render: (category) => formatDate(category.createdAt),
    },
    {
      key: 'actions',
      header: 'Amallar',
      render: (category) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(category);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setCategoryToDelete(category.id);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Kategoriyalar
          </h1>
          <p className="text-muted-foreground">
            Video darslar bo'limlarini boshqaring
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Yangi kategoriya
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Ikonka</Label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nomi</Label>
                <Input
                  id="name"
                  placeholder="Kategoriya nomi"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea
                  id="description"
                  placeholder="Qisqacha tavsif"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Narxi (so'm)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="150000"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
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

      {/* Data Table */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={categories}
          columns={columns}
          searchPlaceholder="Kategoriya nomi bo'yicha qidirish..."
          searchKeys={['name', 'description']}
          onRowClick={(category) => navigate(`/admin/categories/${category.id}`)}
          emptyMessage="Kategoriyalar topilmadi"
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Kategoriyani o'chirish"
        description="Rostdan ham bu kategoriyani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
