import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Plus, Pencil, Trash2, Clock, Eye} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {DataTable, Column, Filter} from '@/components/DataTable';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {videosApi, categoriesApi} from '@/services/api';
import {formatDate} from "@/lib/utils.ts";

interface Video {
    id: string;
    title: string;
    description: string;
    category?: {
        id: string;
        name: string;
        icon: string;
    };
    category_name?: string;
    duration: string;
    view_count: number;
    thumbnail: string;
    created_at: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

export default function AdminVideos() {
    const navigate = useNavigate();
    const [videos, setVideos] = useState<Video[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
    const {toast} = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [videosRes, categoriesRes] = await Promise.all([
                videosApi.getAll(),
                categoriesApi.getAll(),
            ]);
            console.log(videosRes, categoriesRes);
            const videosData = videosRes?.results || videosRes || [];
            const categoriesData = categoriesRes?.results || categoriesRes || [];

            setVideos(Array.isArray(videosData) ? videosData : []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
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

    const handleDelete = async () => {
        if (videoToDelete) {
            try {
                await videosApi.delete(videoToDelete);
                setVideos(prev => prev.filter(v => v.id !== videoToDelete));
                toast({title: 'O\'chirildi', description: 'Video o\'chirildi'});
            } catch (error) {
                toast({
                    title: 'Xatolik',
                    description: 'O\'chirishda xatolik',
                    variant: 'destructive',
                });
            } finally {
                setVideoToDelete(null);
            }
        }
    };

    const columns: Column<Video>[] = [
        {
            key: 'title',
            header: 'Video',
            render: (video) => (
                <div className="flex items-center gap-3">
                    <img
                        src={video.thumbnail || '/placeholder.svg'}
                        alt={video.title}
                        className="h-12 w-20 rounded-lg object-cover"
                    />
                    <div>
                        <p className="font-medium text-card-foreground line-clamp-1">{video.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Kategoriya',
            render: (video) => (
                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    {video.category?.name || video.category_name || '-'}
                </span>
            ),
        },
        {
            key: 'duration',
            header: 'Davomiylik',
            render: (video) => (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4"/>
                    {video.duration}
                </div>
            ),
        },
        {
            key: 'view_count',
            header: 'Ko\'rishlar',
            sortable: true,
            render: (video) => (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-4 w-4"/>
                    {video.view_count}
                </div>
            ),
        },
        {
            key: 'created_at',
            header: 'Qo\'shilgan',
            sortable: true,
            render: (video) => formatDate(video.created_at),
        },
        {
            key: 'actions',
            header: 'Amallar',
            render: (video) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/videos/add?edit=${video.id}`);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="h-4 w-4"/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setVideoToDelete(video.id);
                        }}
                        className="h-8 w-8 text-muted-foreground text-destructive"
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            ),
        },
    ];

    const filters: Filter[] = [
        {
            key: 'category.id',
            label: 'Kategoriya',
            options: categories.map(cat => ({
                value: cat.id,
                label: `${cat.icon} ${cat.name}`,
            })),
        },
    ];

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="animate-fade-in">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Video darslar
                    </h1>
                    <p className="text-muted-foreground">
                        Video darslarni boshqaring
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/admin/videos/add')}
                    className="gradient-primary text-primary-foreground"
                >
                    <Plus className="mr-2 h-4 w-4"/>
                    Yangi video
                </Button>
            </div>

            {/* Data Table */}
            <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
                <DataTable
                    data={videos}
                    columns={columns}
                    filters={filters}
                    searchPlaceholder="Video nomi bo'yicha qidirish..."
                    searchKeys={['title', 'description']}
                    onRowClick={(video) => navigate(`/admin/videos/${video.id}`)}
                    emptyMessage={loading ? "Yuklanmoqda..." : "Videolar topilmadi"}
                />
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!videoToDelete}
                onOpenChange={(open) => !open && setVideoToDelete(null)}
                title="Videoni o'chirish"
                description="Rostdan ham bu videoni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </DashboardLayout>
    );
}
