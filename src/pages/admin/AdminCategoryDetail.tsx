import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, Clock, Layers, Video, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from "@/lib/utils.ts";
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from "react";
import { categoriesApi, videosApi, modulesApi } from "@/services/api";

interface Category {
    id: string;
    name: string;
    icon: string;
    description: string;
    video_count: number;
    is_modular: boolean;
    requires_sequential: boolean;
    price: number;
}

interface Module {
    id: string;
    name: string;
    description: string;
    order: number;
    price: number;
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
    module?: number;
    module_name?: string;
}

export default function AdminCategoryDetail() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [category, setCategory] = useState<Category | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

    const getCategory = async () => {
        try {
            const response = await categoriesApi.getById(categoryId!);
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

    const getModules = async () => {
        try {
            const response = await modulesApi.getByCategory(categoryId!);
            setModules(response?.results || response || []);
        } catch (error) {
            console.log(error);
        }
    };

    const getVideos = async (moduleId?: string) => {
        try {
            const response = await videosApi.getByCategory(categoryId!);
            let videosList = response?.results || response || [];
            
            // Filter by module if specified
            if (moduleId) {
                videosList = videosList.filter((v: Video) => String(v.module) === moduleId);
            }
            
            setVideos(videosList);
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
            getModules();
            getVideos();
        }
    }, [categoryId]);

    useEffect(() => {
        if (selectedModuleId) {
            getVideos(selectedModuleId);
        } else if (category && !category.is_modular) {
            getVideos();
        }
    }, [selectedModuleId]);

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
            toast({ title: 'O\'chirildi', description: 'Video o\'chirildi' });
        } catch (error) {
            toast({ title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive' });
        }
    };

    const handleDeleteModule = async (moduleId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await modulesApi.delete(moduleId);
            setModules(prev => prev.filter(m => m.id !== moduleId));
            toast({ title: 'O\'chirildi', description: 'Modul o\'chirildi' });
        } catch (error) {
            toast({ title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive' });
        }
    };

    const videoColumns: Column<Video>[] = [
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
                    <Clock className="h-4 w-4 text-muted-foreground" />
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
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    {video.view_count || 0}
                </div>
            ),
        },
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
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(video.id, e)}
                        className="h-8 w-8 text-muted-foreground text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const moduleColumns: Column<Module>[] = [
        {
            key: 'name',
            header: 'Modul nomi',
            render: (module) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Layers className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-medium text-card-foreground">{module.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{module.description}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'video_count',
            header: 'Videolar',
            render: (module) => (
                <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    {module.video_count || 0} ta
                </div>
            ),
        },
        {
            key: 'price',
            header: 'Narxi',
            render: (module) => module.price 
                ? new Intl.NumberFormat('uz-UZ').format(module.price) + ' so\'m' 
                : 'Kurs narxida',
        },
        {
            key: 'actions',
            header: 'Amallar',
            render: (module) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModuleId(module.id);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteModule(module.id, e)}
                        className="h-8 w-8 text-muted-foreground text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
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
                onClick={() => {
                    if (selectedModuleId) {
                        setSelectedModuleId(null);
                        getVideos();
                    } else {
                        navigate('/admin/categories');
                    }
                }}
                className="mb-6 -ml-2"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
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
                                {selectedModuleId && modules.find(m => m.id === selectedModuleId) && (
                                    <span className="text-muted-foreground font-normal text-lg ml-2">
                                        / {modules.find(m => m.id === selectedModuleId)?.name}
                                    </span>
                                )}
                            </h1>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <span>{category.video_count || videos.length} ta video dars</span>
                                {category.is_modular && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                                        <Layers className="h-3 w-3" />
                                        {modules.length} modul
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        {category.description}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/admin/categories/${categoryId}/edit`)}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Tahrirlash
                    </Button>
                    <Button
                        onClick={() => {
                            const url = selectedModuleId 
                                ? `/admin/videos/add?category=${categoryId}&module=${selectedModuleId}`
                                : `/admin/videos/add?category=${categoryId}`;
                            navigate(url);
                        }}
                        className="gradient-primary text-primary-foreground"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Video qo'shish
                    </Button>
                </div>
            </div>

            {/* Content */}
            {category.is_modular && !selectedModuleId ? (
                // Show modules list
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Modullar</h2>
                        <p className="text-sm text-muted-foreground">
                            Modulni tanlang yoki yangi modul qo'shing
                        </p>
                    </div>
                    <DataTable
                        data={modules}
                        columns={moduleColumns}
                        searchPlaceholder="Modul nomi bo'yicha qidirish..."
                        searchKeys={['name', 'description']}
                        onRowClick={(module) => setSelectedModuleId(module.id)}
                        emptyMessage={loading ? "Yuklanmoqda..." : "Modullar topilmadi. Kursni tahrirlash orqali modul qo'shing."}
                    />
                </div>
            ) : (
                // Show videos list
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <DataTable
                        data={videos}
                        columns={videoColumns}
                        searchPlaceholder="Video nomi bo'yicha qidirish..."
                        searchKeys={['title', 'description']}
                        onRowClick={(video) => navigate(`/admin/videos/${video.id}`)}
                        emptyMessage={loading ? "Yuklanmoqda..." : "Bu kategoriyada videolar topilmadi"}
                    />
                </div>
            )}
        </DashboardLayout>
    );
}
