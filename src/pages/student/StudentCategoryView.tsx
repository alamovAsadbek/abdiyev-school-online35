import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, LayoutGrid, Table2, Clock, CheckCircle2, Lock, Filter, Undo2, Layers, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { VideoCard } from '@/components/VideoCard';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProgress } from '@/contexts/ProgressContext';
import { useToast } from '@/hooks/use-toast';
import api from "@/services/api.ts";
import { modulesApi, userCoursesApi } from '@/services/api';

type ViewMode = 'card' | 'table';
type FilterStatus = 'all' | 'completed' | 'not-completed' | 'locked';

interface Module {
    id: string;
    name: string;
    description: string;
    order: number;
    price: number;
    video_count: number;
}

export default function StudentCategoryView() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { isVideoCompleted, isTaskCompleted } = useProgress();
    const { toast } = useToast();
    const [category, setCategory] = useState<any>(null);
    const [allVideos, setAllVideos] = useState<any[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [accessibleModuleIds, setAccessibleModuleIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

    const getCategory = async (categoryId: string) => {
        try {
            const response = await api.get(`/categories/${categoryId}`);
            setCategory(response);
        } catch (e: any) {
            toast({
                title: 'Xatolik',
                description: e.message,
            });
        }
    };

    const getModules = async (categoryId: string) => {
        try {
            const response = await modulesApi.getByCategory(categoryId);
            setModules(response?.results || response || []);
        } catch (e) {
            console.log(e);
        }
    };

    const getAccessibleModules = async () => {
        try {
            const response = await userCoursesApi.getMyCourses();
            const myCourses = response?.results || response || [];
            const currentCourse = myCourses.find((c: any) => String(c.category?.id || c.category) === categoryId);
            if (currentCourse && currentCourse.modules) {
                setAccessibleModuleIds(currentCourse.modules.map((m: any) => String(m.id || m)));
            } else {
                // Full access if not modular or has full course access
                setAccessibleModuleIds([]);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const getVideosByCategoryId = async (categoryId: string, moduleId?: string) => {
        try {
            const response = await api.get(`/videos/by_category/`, {
                'category_id': categoryId,
            });
            let videos = response?.results || response || [];
            
            if (moduleId) {
                videos = videos.filter((v: any) => String(v.module) === moduleId);
            }
            
            setAllVideos(videos);
        } catch (e: any) {
            toast({
                title: 'Xatolik',
                description: e.message,
            });
        }
    };

    useEffect(() => {
        if (categoryId) {
            getCategory(categoryId);
            getModules(categoryId);
            getAccessibleModules();
            getVideosByCategoryId(categoryId);
        }
    }, [categoryId]);

    useEffect(() => {
        if (selectedModuleId && categoryId) {
            getVideosByCategoryId(categoryId, selectedModuleId);
        } else if (category && !category.is_modular && categoryId) {
            getVideosByCategoryId(categoryId);
        }
    }, [selectedModuleId]);

    // Check if module is accessible
    const isModuleAccessible = (moduleId: string): boolean => {
        if (!category?.is_modular) return true;
        if (accessibleModuleIds.length === 0) return true; // Full access
        return accessibleModuleIds.includes(moduleId);
    };

    // Check if video is locked (previous video not completed or task not done)
    const isVideoLocked = (video: any): boolean => {
        if (!category?.requires_sequential) return false;
        
        const videoIndex = allVideos.findIndex(v => v.id === video.id);
        if (videoIndex === 0) return false; // First video is always unlocked

        const previousVideo = allVideos[videoIndex - 1];
        if (!isVideoCompleted(previousVideo.id)) return true;

        // Check if previous video's task is completed (if it has one)
        if (previousVideo.tasks && previousVideo.tasks.length > 0) {
            const hasCompletedTask = previousVideo.tasks.some((task: any) => isTaskCompleted(task.id));
            if (!hasCompletedTask) return true;
        }

        return false;
    };

    // Filter videos
    const filteredVideos = allVideos.filter(video => {
        const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase()) ||
            (video.description || '').toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        const completed = isVideoCompleted(video.id);
        const locked = isVideoLocked(video);

        switch (filterStatus) {
            case 'completed':
                return completed;
            case 'not-completed':
                return !completed && !locked;
            case 'locked':
                return locked;
            default:
                return true;
        }
    });

    const handleVideoClick = (video: any) => {
        if (isVideoLocked(video)) {
            toast({
                title: "Video qulflangan",
                description: "Bu videoni ko'rish uchun avvalgi darslarni tugatishingiz va vazifalarni bajarishingiz kerak.",
                variant: "destructive"
            });
            return;
        }
        navigate(`/student/video/${video.id}`);
    };

    const handleModuleClick = (module: Module) => {
        if (!isModuleAccessible(module.id)) {
            toast({
                title: "Modul qulflangan",
                description: "Bu modulga kirish uchun uni sotib olishingiz kerak.",
                variant: "destructive"
            });
            return;
        }
        setSelectedModuleId(module.id);
    };

    interface VideoType {
        id: string;
        title: string;
        description: string;
        thumbnail: string;
        duration: string;
        order: number;
    }

    const videoColumns: Column<VideoType>[] = [
        {
            key: 'title',
            header: 'Video',
            sortable: true,
            render: (video) => {
                const locked = isVideoLocked(video);
                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={video.thumbnail}
                            alt={video.title}
                            className={`w-16 h-10 object-cover rounded ${locked ? 'opacity-50' : ''}`}
                        />
                        <div>
                            <p className={`font-medium ${locked ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {video.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'duration',
            header: 'Davomiyligi',
            render: (video) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {video.duration}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Holat',
            render: (video) => {
                const completed = isVideoCompleted(video.id);
                const locked = isVideoLocked(video);

                if (locked) {
                    return (
                        <div className="status-badge bg-muted text-muted-foreground">
                            <Lock className="h-3.5 w-3.5" />
                            Qulflangan
                        </div>
                    );
                }
                if (completed) {
                    return (
                        <div className="status-badge status-completed">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Ko'rildi
                        </div>
                    );
                }
                return (
                    <div className="status-badge status-new">
                        Yangi
                    </div>
                );
            },
        },
    ];

    if (!category) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground mb-4">Kategoriya topilmadi</p>
                    <Button onClick={() => navigate('/student/categories')}>
                        <Undo2 />
                        Orqaga qaytish
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    // Show modules list for modular courses
    if (category.is_modular && modules.length > 0 && !selectedModuleId) {
        return (
            <DashboardLayout>
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6 -ml-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Orqaga
                </Button>

                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                            {category.icon}
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                {category.name}
                            </h1>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                {modules.length} ta modul
                            </p>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        {category.description}
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module, index) => {
                        const accessible = isModuleAccessible(module.id);
                        return (
                            <div
                                key={module.id}
                                onClick={() => handleModuleClick(module)}
                                className={`group cursor-pointer rounded-xl border p-5 transition-all duration-300 ${
                                    accessible 
                                        ? 'border-border bg-card hover:border-primary/50 hover:shadow-lg' 
                                        : 'border-border/50 bg-muted/30 opacity-60'
                                }`}
                                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                        accessible ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {accessible ? <Layers className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                                    </div>
                                    <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${
                                        accessible ? 'text-muted-foreground group-hover:translate-x-1 group-hover:text-primary' : 'text-muted-foreground/50'
                                    }`} />
                                </div>
                                
                                <h3 className={`font-semibold text-lg mb-2 ${
                                    accessible ? 'text-card-foreground' : 'text-muted-foreground'
                                }`}>
                                    {module.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {module.description}
                                </p>
                                
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {module.video_count || 0} ta video
                                    </span>
                                    {!accessible && module.price && (
                                        <span className="text-primary font-medium">
                                            {new Intl.NumberFormat('uz-UZ').format(module.price)} so'm
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => {
                    if (selectedModuleId) {
                        setSelectedModuleId(null);
                        if (categoryId) getVideosByCategoryId(categoryId);
                    } else {
                        navigate(-1);
                    }
                }}
                className="mb-6 -ml-2"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Orqaga
            </Button>

            {/* Header */}
            <div className="mb-8 animate-fade-in">
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
                        <p className="text-muted-foreground">{allVideos.length} ta video dars</p>
                    </div>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                    {category.description}
                </p>
            </div>

            {/* Search, Filters, and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Video qidirish..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filter */}
                <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Holat bo'yicha" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        <SelectItem value="completed">Ko'rilganlar</SelectItem>
                        <SelectItem value="not-completed">Ko'rilmaganlar</SelectItem>
                        <SelectItem value="locked">Qulflangan</SelectItem>
                    </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'card' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setViewMode('card')}
                        className={viewMode === 'card' ? 'gradient-primary text-primary-foreground' : ''}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setViewMode('table')}
                        className={viewMode === 'table' ? 'gradient-primary text-primary-foreground' : ''}
                    >
                        <Table2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Videos */}
            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredVideos.map((video, index) => (
                        <div key={video.id} className="animate-fade-in"
                             style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                            <VideoCard
                                video={video}
                                onClick={() => handleVideoClick(video)}
                                isLocked={isVideoLocked(video)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="animate-fade-in">
                    <DataTable
                        data={filteredVideos}
                        columns={videoColumns}
                        searchPlaceholder="Video qidirish..."
                        searchKeys={['title', 'description']}
                        onRowClick={(video) => handleVideoClick(video)}
                        emptyMessage="Hech qanday video topilmadi"
                    />
                </div>
            )}

            {filteredVideos.length === 0 && viewMode === 'card' && (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                    <p className="text-muted-foreground">
                        {search || filterStatus !== 'all'
                            ? "Hech qanday video topilmadi"
                            : "Bu kategoriyada hali video yo'q"}
                    </p>
                </div>
            )}
        </DashboardLayout>
    );
}
