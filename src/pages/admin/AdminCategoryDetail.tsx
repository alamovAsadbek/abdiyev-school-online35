import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft, Plus, Pencil, Trash2, Eye, Clock} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {DataTable, Column} from '@/components/DataTable';
import {Button} from '@/components/ui/button';
import {formatDate} from "@/lib/utils.ts";
import {useToast} from '@/hooks/use-toast';
import {useEffect, useState} from "react";
import {categoriesApi, videosApi} from "@/services/api";

interface Category {
    id: string;
    name: string;
    icon: string;
    description: string;
    video_count: number;
}

interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    duration: string;
    view_count: number;
    order: number;
    created_at: string;
}

export default function AdminCategoryDetail() {
    const {categoryId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();
    const [category, setCategory] = useState<Category | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    const getCategory = async () => {
        try {
            const response = await categoriesApi.getById(categoryId!);
            console.log(response)
            setCategory(response);
        } catch (error) {
            console.log(error);
            toast({
                title: 'Xatolik',
                description: "Server bilan bog'lanishda xatolik yuz berdi!",
                variant: 'destructive'
            });
        }
    };

    const getVideos = async () => {
        try {
            const response = await videosApi.getByCategory(categoryId!);
            setVideos(response?.results || response || []);
        } catch (error) {
            console.log(error);
            toast({
                title: 'Xatolik',
                description: "Server bilan bog'lanishda xatolik yuz berdi!",
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (categoryId) {
            getCategory();
            getVideos();
        }
    }, [categoryId]);

    if (!category) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground mb-4">
                        {loading ? "Yuklanmoqda..." : "Kategoriya topilmadi"}
                    </p>
                    {!loading && (
                        <Button onClick={() => navigate('/admin/categories')}>
                            Orqaga qaytish
                        </Button>
                    )}
                </div>
            </DashboardLayout>
        );
    }

    const handleDelete = async (videoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await videosApi.delete(videoId);
            setVideos(prev => prev.filter(v => v.id !== videoId));
            toast({title: 'O\'chirildi', description: 'Video o\'chirildi'});
        } catch (error) {
            toast({title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive'});
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
                        className="w-16 h-10 object-cover rounded"
                    />
                    <div>
                        <p className="font-medium text-card-foreground">{video.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'duration',
            header: 'Davomiyligi',
            render: (video) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground"/>
                    {video.duration}
                </div>
            ),
        },
        {
            key: 'view_count',
            header: 'Ko\'rishlar',
            sortable: true,
            render: (video) => (
                <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground"/>
                    {video.view_count || 0}
                </div>
            ),
        },
        // {
        //     key: 'order',
        //     header: 'Tartib',
        //     sortable: true,
        //     render: (video) => `${video.order}-dars`,
        // },
        {
            key: 'created_at',
            header: 'Yaratilgan',
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
                        onClick={(e) => handleDelete(video.id, e)}
                        className="h-8 w-8 text-muted-foreground text-destructive"
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/admin/categories')}
                className="mb-6 -ml-2"
            >
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Orqaga
            </Button>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="animate-fade-in">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                            {category.icon}
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                {category.name}
                            </h1>
                            <p className="text-muted-foreground">{category.video_count || videos.length} ta video dars</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        {category.description}
                    </p>
                </div>
                <Button
                    onClick={() => navigate(`/admin/videos/add?category=${categoryId}`)}
                    className="gradient-primary text-primary-foreground"
                >
                    <Plus className="mr-2 h-4 w-4"/>
                    Video qo'shish
                </Button>
            </div>

            {/* Videos Table */}
            <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
                <DataTable
                    data={videos}
                    columns={columns}
                    searchPlaceholder="Video nomi bo'yicha qidirish..."
                    searchKeys={['title', 'description']}
                    onRowClick={(video) => navigate(`/admin/videos/${video.id}`)}
                    emptyMessage={loading ? "Yuklanmoqda..." : "Bu kategoriyada videolar topilmadi"}
                />
            </div>
        </DashboardLayout>
    );
}