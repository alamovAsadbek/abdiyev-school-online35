import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, Clock, Layers, Video, ChevronRight, Users, Settings, Check, X } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDate } from "@/lib/utils.ts";
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from "react";
import { categoriesApi, videosApi, modulesApi, userCoursesApi } from "@/services/api";

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

interface Subscriber {
    id: string;
    user: string;
    user_name: string;
    granted_by: string;
    granted_at: string;
    modules_detail?: Module[];
}

export default function AdminCategoryDetail() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [category, setCategory] = useState<Category | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('content');
    
    // Module creation state
    const [showModuleDialog, setShowModuleDialog] = useState(false);
    const [newModule, setNewModule] = useState({ name: '', description: '', price: '' });
    const [creatingModule, setCreatingModule] = useState(false);
    
    // Settings confirmation state
    const [showSettingsConfirm, setShowSettingsConfirm] = useState(false);
    const [pendingSequentialChange, setPendingSequentialChange] = useState<boolean | null>(null);

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

    const getSubscribers = async () => {
        try {
            const response = await userCoursesApi.getAll({ category_id: categoryId });
            setSubscribers(response?.results || response || []);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (categoryId) {
            getCategory();
            getModules();
            getVideos();
            getSubscribers();
        }
    }, [categoryId]);

    useEffect(() => {
        if (selectedModuleId) {
            getVideos(selectedModuleId);
        } else if (category && !category.is_modular) {
            getVideos();
        }
    }, [selectedModuleId]);

    const handleCreateModule = async () => {
        if (!newModule.name.trim()) {
            toast({ title: 'Xatolik', description: 'Modul nomini kiriting', variant: 'destructive' });
            return;
        }
        
        setCreatingModule(true);
        try {
            await categoriesApi.addModule(categoryId!, {
                name: newModule.name,
                description: newModule.description,
                price: newModule.price ? parseFloat(newModule.price) : null,
                order: modules.length
            });
            toast({ title: 'Muvaffaqiyat', description: 'Modul yaratildi' });
            setShowModuleDialog(false);
            setNewModule({ name: '', description: '', price: '' });
            getModules();
        } catch (error) {
            toast({ title: 'Xatolik', description: 'Modul yaratishda xatolik', variant: 'destructive' });
        } finally {
            setCreatingModule(false);
        }
    };

    const handleSequentialToggle = (checked: boolean) => {
        setPendingSequentialChange(checked);
        setShowSettingsConfirm(true);
    };

    const confirmSequentialChange = async () => {
        if (pendingSequentialChange === null || !category) return;
        
        try {
            await categoriesApi.update(categoryId!, { 
                ...category,
                requires_sequential: pendingSequentialChange 
            });
            setCategory({ ...category, requires_sequential: pendingSequentialChange });
            toast({ 
                title: 'Muvaffaqiyat', 
                description: pendingSequentialChange 
                    ? "Ketma-ket o'qish yoqildi" 
                    : "Ketma-ket o'qish o'chirildi" 
            });
        } catch (error) {
            toast({ title: 'Xatolik', description: 'Sozlamani saqlashda xatolik', variant: 'destructive' });
        } finally {
            setShowSettingsConfirm(false);
            setPendingSequentialChange(null);
        }
    };

    const handleModularClick = () => {
        toast({
            title: "O'zgartirish imkoni yo'q",
            description: "Modullik sozlamasi faqat kurs yaratishda o'rnatiladi. Uni keyinchalik o'zgartirib bo'lmaydi.",
            variant: 'destructive'
        });
    };

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

    const subscriberColumns: Column<Subscriber>[] = [
        {
            key: 'user_name',
            header: 'Foydalanuvchi',
            render: (sub) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {sub.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-card-foreground">{sub.user_name}</p>
                        {sub.modules_detail && sub.modules_detail.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {sub.modules_detail.map(m => m.name).join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'granted_by',
            header: 'Berilgan usul',
            render: (sub) => (
                <span className={`px-2 py-1 rounded-full text-xs ${
                    sub.granted_by === 'gift' 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-primary/10 text-primary'
                }`}>
                    {sub.granted_by === 'gift' ? "Sovg'a" : "To'lov"}
                </span>
            ),
        },
        {
            key: 'granted_at',
            header: 'Sana',
            sortable: true,
            render: (sub) => formatDate(sub.granted_at),
        },
        {
            key: 'actions',
            header: '',
            render: (sub) => (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/users/${sub.user}`);
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    // Content for module view (when a module is selected)
    if (selectedModuleId) {
        const selectedModule = modules.find(m => m.id === selectedModuleId);
        
        return (
            <DashboardLayout>
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSelectedModuleId(null);
                        getVideos();
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
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                <Layers className="h-7 w-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                    {selectedModule?.name}
                                </h1>
                                <p className="text-muted-foreground">
                                    {category.name} / {videos.length} ta video dars
                                </p>
                            </div>
                        </div>
                        {selectedModule?.description && (
                            <p className="text-muted-foreground max-w-2xl">
                                {selectedModule.description}
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={() => navigate(`/admin/videos/add?category=${categoryId}&module=${selectedModuleId}`)}
                        className="gradient-primary text-primary-foreground"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Video qo'shish
                    </Button>
                </div>

                {/* Videos Table */}
                <DataTable
                    data={videos}
                    columns={videoColumns}
                    searchPlaceholder="Video nomi bo'yicha qidirish..."
                    searchKeys={['title', 'description']}
                    onRowClick={(video) => navigate(`/admin/videos/${video.id}`)}
                    emptyMessage={loading ? "Yuklanmoqda..." : "Bu modulda videolar topilmadi"}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/admin/categories')}
                className="mb-6 -ml-2"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Orqaga
            </Button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="animate-fade-in">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                            {category.icon}
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                {category.name}
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
                </div>
                <div className="flex gap-2">
                    {category.is_modular && (
                        <Button
                            variant="outline"
                            onClick={() => setShowModuleDialog(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Modul qo'shish
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            const url = category.is_modular && modules.length === 0
                                ? undefined
                                : `/admin/videos/add?category=${categoryId}`;
                            if (category.is_modular && modules.length === 0) {
                                toast({
                                    title: 'Avval modul yarating',
                                    description: "Modullik kursga video qo'shish uchun avval modul yaratishingiz kerak.",
                                    variant: 'destructive'
                                });
                            } else if (category.is_modular) {
                                toast({
                                    title: 'Modul tanlang',
                                    description: "Video qo'shish uchun modulni tanlang.",
                                });
                            } else {
                                navigate(`/admin/videos/add?category=${categoryId}`);
                            }
                        }}
                        className="gradient-primary text-primary-foreground"
                        disabled={category.is_modular}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Video qo'shish
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                    <TabsTrigger value="content" className="flex items-center gap-2">
                        {category.is_modular ? <Layers className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                        {category.is_modular ? 'Modullar' : 'Videolar'}
                    </TabsTrigger>
                    <TabsTrigger value="subscribers" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Obunachlar
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Sozlamalar
                    </TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="animate-fade-in">
                    {category.is_modular ? (
                        <DataTable
                            data={modules}
                            columns={moduleColumns}
                            searchPlaceholder="Modul nomi bo'yicha qidirish..."
                            searchKeys={['name', 'description']}
                            onRowClick={(module) => setSelectedModuleId(module.id)}
                            emptyMessage={loading ? "Yuklanmoqda..." : "Modullar topilmadi. Modul qo'shish tugmasini bosing."}
                        />
                    ) : (
                        <DataTable
                            data={videos}
                            columns={videoColumns}
                            searchPlaceholder="Video nomi bo'yicha qidirish..."
                            searchKeys={['title', 'description']}
                            onRowClick={(video) => navigate(`/admin/videos/${video.id}`)}
                            emptyMessage={loading ? "Yuklanmoqda..." : "Bu kategoriyada videolar topilmadi"}
                        />
                    )}
                </TabsContent>

                {/* Subscribers Tab */}
                <TabsContent value="subscribers" className="animate-fade-in">
                    <DataTable
                        data={subscribers}
                        columns={subscriberColumns}
                        searchPlaceholder="Foydalanuvchi nomi bo'yicha qidirish..."
                        searchKeys={['user_name']}
                        onRowClick={(sub) => navigate(`/admin/users/${sub.user}`)}
                        emptyMessage="Bu kursni sotib olgan yoki sovg'a qilingan foydalanuvchilar topilmadi"
                    />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="animate-fade-in">
                    <div className="max-w-2xl space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Kurs haqida</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-muted-foreground">Nomi</Label>
                                    <p className="text-foreground font-medium">{category.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Tavsif</Label>
                                    <p className="text-foreground">{category.description || "Tavsif yo'q"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Narxi</Label>
                                    <p className="text-foreground font-medium">
                                        {category.price 
                                            ? new Intl.NumberFormat('uz-UZ').format(category.price) + " so'm"
                                            : "Bepul"
                                        }
                                    </p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={() => navigate(`/admin/categories/${categoryId}/edit`)}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Tahrirlash
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Kurs sozlamalari</h3>
                            <div className="space-y-6">
                                {/* Modular setting - read-only */}
                                <div 
                                    className="flex items-center justify-between cursor-pointer opacity-60"
                                    onClick={handleModularClick}
                                >
                                    <div>
                                        <Label className="text-foreground font-medium">Modullik kurs</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Kurs modullarga bo'lingan
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {category.is_modular ? 'Ha' : 'Yo\'q'}
                                        </span>
                                        <Switch checked={category.is_modular} disabled />
                                    </div>
                                </div>

                                {/* Sequential setting */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-foreground font-medium">Ketma-ket o'qish</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Keyingi darsni ko'rish uchun avvalgisini tugatish va vazifani bajarish shart
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={category.requires_sequential} 
                                        onCheckedChange={handleSequentialToggle}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Module Creation Dialog */}
            <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yangi modul yaratish</DialogTitle>
                        <DialogDescription>
                            {category.name} kursiga yangi modul qo'shing
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="moduleName">Modul nomi *</Label>
                            <Input
                                id="moduleName"
                                placeholder="Masalan: 1-bo'lim"
                                value={newModule.name}
                                onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="moduleDescription">Tavsif</Label>
                            <Textarea
                                id="moduleDescription"
                                placeholder="Modul haqida qisqacha ma'lumot"
                                value={newModule.description}
                                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="modulePrice">Narxi (ixtiyoriy)</Label>
                            <Input
                                id="modulePrice"
                                type="number"
                                placeholder="Agar alohida sotilsa"
                                value={newModule.price}
                                onChange={(e) => setNewModule({ ...newModule, price: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={handleCreateModule} disabled={creatingModule}>
                            {creatingModule ? 'Yaratilmoqda...' : 'Yaratish'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Confirmation Dialog */}
            <Dialog open={showSettingsConfirm} onOpenChange={setShowSettingsConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sozlamani o'zgartirish</DialogTitle>
                        <DialogDescription>
                            {pendingSequentialChange 
                                ? "Ketma-ket o'qishni yoqmoqchimisiz? Bu o'quvchilarni darslarni tartib bilan ko'rishga majbur qiladi."
                                : "Ketma-ket o'qishni o'chirmoqchimisiz? O'quvchilar istalgan darsni ko'ra oladi."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSettingsConfirm(false)}>
                            <X className="mr-2 h-4 w-4" />
                            Bekor qilish
                        </Button>
                        <Button onClick={confirmSequentialChange}>
                            <Check className="mr-2 h-4 w-4" />
                            Tasdiqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
