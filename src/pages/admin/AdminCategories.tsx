import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Plus, Pencil, Trash2, Video, Layers, Lock, Unlock} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {DataTable, Column} from '@/components/DataTable';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {useToast} from '@/hooks/use-toast';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {categoriesApi} from '@/services/api';
import { formatDate } from "@/lib/utils";

interface Module {
    id: string;
    name: string;
    description: string;
    order: number;
    price?: number;
}

interface Category {
    id: string;
    name: string;
    description: string;
    icon: string;
    video_count: number;
    price: number;
    is_modular: boolean;
    requires_sequential: boolean;
    modules?: Module[];
    created_at: string;
}

const iconOptions = ['⚗️', '🧪', '🔬', '📊', '🧬', '⚛️', '🔥', '💧'];

export default function AdminCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '', 
        description: '', 
        icon: '⚗️', 
        price: '',
        is_modular: false,
        requires_sequential: true
    });
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const {toast} = useToast();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoriesApi.getAll();
            const data = response?.results || response || [];
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            toast({
                title: 'Xatolik',
                description: 'Kategoriyalarni yuklashda xatolik',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description,
                icon: category.icon,
                price: category.price.toString(),
                is_modular: category.is_modular || false,
                requires_sequential: category.requires_sequential !== false,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '', 
                description: '', 
                icon: '⚗️', 
                price: '',
                is_modular: false,
                requires_sequential: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast({title: 'Xatolik', description: 'Kategoriya nomini kiriting', variant: 'destructive'});
            return;
        }

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                icon: formData.icon,
                price: parseInt(formData.price) || 0,
                is_modular: formData.is_modular,
                requires_sequential: formData.requires_sequential,
            };

            if (editingCategory) {
                await categoriesApi.update(editingCategory.id, payload);
                toast({title: 'Muvaffaqiyat', description: 'Kurs yangilandi'});
            } else {
                await categoriesApi.create(payload);
                toast({title: 'Muvaffaqiyat', description: 'Yangi kurs qo\'shildi'});
            }

            setIsDialogOpen(false);
            fetchCategories();
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'Saqlashda xatolik',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (categoryToDelete) {
            try {
                await categoriesApi.delete(categoryToDelete);
                setCategories(prev => prev.filter(c => c.id !== categoryToDelete));
                toast({title: 'O\'chirildi', description: 'Kategoriya o\'chirildi'});
            } catch (error) {
                toast({
                    title: 'Xatolik',
                    description: 'O\'chirishda xatolik',
                    variant: 'destructive',
                });
            } finally {
                setCategoryToDelete(null);
            }
        }
    };


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
    };

    const columns: Column<Category>[] = [
        {
            key: 'name',
            header: 'Kurs nomi',
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
            key: 'video_count',
            header: 'Videolar',
            sortable: true,
            render: (category) => (
                <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground"/>
                    {category.video_count || 0} ta
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
            key: 'created_at',
            header: 'Yaratilgan',
            sortable: true,
            render: (category) => formatDate(category.created_at),
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
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card"
                    >
                        <Pencil className="h-4 w-4"/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCategoryToDelete(category.id);
                        }}
                        className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                    >
                        <Trash2 className="h-4 w-4"/>
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
                        Kurslar
                    </h1>
                    <p className="text-muted-foreground">
                        Video darslar bo'limlarini boshqaring
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
                            <Plus className="mr-2 h-4 w-4"/>
                            Yangi kurs
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
                                            type="button"
                                            onClick={() => setFormData(prev => ({...prev, icon}))}
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
                                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Tavsif</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Qisqacha tavsif"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Narxi (so'm)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="150000"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                                />
                            </div>
                            
                            {/* Modular toggle */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="space-y-0.5">
                                    <Label className="flex items-center gap-2">
                                        <Layers className="h-4 w-4"/>
                                        Modulli kurs
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Kursni modullarga ajratish (alohida sotish mumkin)
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_modular}
                                    onCheckedChange={(checked) => setFormData(prev => ({...prev, is_modular: checked}))}
                                />
                            </div>
                            
                            {/* Sequential access toggle */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="space-y-0.5">
                                    <Label className="flex items-center gap-2">
                                        {formData.requires_sequential ? <Lock className="h-4 w-4"/> : <Unlock className="h-4 w-4"/>}
                                        Ketma-ket ko'rish
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {formData.requires_sequential 
                                            ? "Video va vazifalarni ketma-ket bajarish shart" 
                                            : "O'quvchi istalgan darsni ko'ra oladi"}
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.requires_sequential}
                                    onCheckedChange={(checked) => setFormData(prev => ({...prev, requires_sequential: checked}))}
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Bekor qilish</Button>
                                <Button onClick={handleSave}
                                        className="gradient-primary text-primary-foreground">Saqlash</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Data Table */}
            <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
                <DataTable
                    data={categories}
                    columns={columns}
                    searchPlaceholder="Kategoriya nomi bo'yicha qidirish..."
                    searchKeys={['name', 'description']}
                    onRowClick={(category) => navigate(`/admin/categories/${category.id}`)}
                    emptyMessage={loading ? "Yuklanmoqda..." : "Kategoriyalar topilmadi"}
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
