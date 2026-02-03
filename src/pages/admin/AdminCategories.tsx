import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Plus, Pencil, Trash2, Video, Layers} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {DataTable, Column} from '@/components/DataTable';
import {Button} from '@/components/ui/button';
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
            key: 'is_modular',
            header: 'Turi',
            render: (category) => (
                <div className="flex items-center gap-1">
                    {category.is_modular ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
                            <Layers className="h-3 w-3" />
                            Modulli
                        </span>
                    ) : (
                        <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                            Oddiy
                        </span>
                    )}
                </div>
            ),
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
                            navigate(`/admin/categories/${category.id}/edit`);
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
                <Button onClick={() => navigate('/admin/categories/create')} className="gradient-primary text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4"/>
                    Yangi kurs
                </Button>
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
