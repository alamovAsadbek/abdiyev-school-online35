import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, Table2, Lock, ShoppingCart, Eye, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { videosApi, categoriesApi, userCoursesApi, progressApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useProgress } from '@/contexts/ProgressContext';
import { cn } from '@/lib/utils';

type ViewMode = 'card' | 'table';
type FilterType = 'all' | 'watched' | 'unwatched';

interface Video {
    id: string;
    title: string;
    description: string;
    category?: {
        id: string;
        name: string;
        icon: string;
    };
    category_id?: string;
    duration: string;
    view_count: number;
    thumbnail: string;
    order: number;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

interface UserCourse {
    id: string;
    category: string;
    category_id?: string;
}

export default function StudentVideos() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [videos, setVideos] = useState<Video[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [myCourses, setMyCourses] = useState<UserCourse[]>([]);
    const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>([]);
    const [lastWatchedVideo, setLastWatchedVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isVideoCompleted } = useProgress();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [videosRes, categoriesRes, coursesRes] = await Promise.all([
                videosApi.getAll(),
                categoriesApi.getAll(),
                userCoursesApi.getMyCourses(),
            ]);
            
            const allVideos = videosRes?.results || videosRes || [];
            setVideos(allVideos);
            setCategories(categoriesRes?.results || categoriesRes || []);
            setMyCourses(coursesRes?.results || coursesRes || []);
            
            // Fetch backend progress for watched videos
            try {
                const progressData = await progressApi.getMyProgress();
                const completedVideos = progressData?.completed_videos || progressData?.completedVideos || [];
                const watchedIds = completedVideos.map((v: any) => String(v.id || v));
                setWatchedVideoIds(watchedIds);
                
                // Find last watched video (highest order among watched)
                const watchedVideos = allVideos.filter((v: Video) => 
                    watchedIds.includes(String(v.id)) || isVideoCompleted(String(v.id))
                );
                if (watchedVideos.length > 0) {
                    const sorted = watchedVideos.sort((a: Video, b: Video) => (b.order || 0) - (a.order || 0));
                    setLastWatchedVideo(sorted[0]);
                }
            } catch (e) {
                console.log('Could not fetch progress:', e);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get purchased category IDs
    const purchasedCategoryIds = myCourses.map(c => c.category || c.category_id);

    // Filter videos to only show from purchased courses
    const purchasedVideos = videos.filter(video => {
        const categoryId = video.category?.id || video.category_id;
        return purchasedCategoryIds.includes(categoryId);
    });

    // Get categories that user has purchased
    const purchasedCategories = categories.filter(cat => 
        purchasedCategoryIds.includes(cat.id)
    );

    const isWatched = (videoId: string) => {
        return watchedVideoIds.includes(String(videoId)) || isVideoCompleted(String(videoId));
    };

    const filteredVideos = purchasedVideos.filter(video => {
        const matchesSearch = video.title?.toLowerCase().includes(search.toLowerCase()) ||
            video.description?.toLowerCase().includes(search.toLowerCase());
        const categoryId = video.category?.id || video.category_id;
        const matchesCategory = selectedCategory === 'all' || categoryId === selectedCategory;
        
        // Filter by watched status
        const videoWatched = isWatched(video.id);
        const matchesFilter = filterType === 'all' || 
            (filterType === 'watched' && videoWatched) || 
            (filterType === 'unwatched' && !videoWatched);
            
        return matchesSearch && matchesCategory && matchesFilter;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

    const columns: Column<Video>[] = [
        {
            key: 'title',
            header: 'Nomi',
            sortable: true,
            render: (video) => (
                <div className="flex items-center gap-2">
                    {isWatched(video.id) && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    <div>
                        <p className="font-medium">{video.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'category',
            header: 'Kategoriya',
            render: (video) => (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {video.category?.icon} {video.category?.name}
                </span>
            )
        },
        { key: 'duration', header: 'Davomiyligi', sortable: true, render: (video) => video.duration },
        { key: 'view_count', header: 'Ko\'rishlar', sortable: true, render: (video) => `${video.view_count} ta` },
    ];

    // If user has no purchased courses
    if (!loading && myCourses.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <Lock className="h-20 w-20 text-muted-foreground mb-6" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Siz hali kurs sotib olmagansiz
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Video darslarni ko'rish uchun avval kurs sotib olishingiz kerak. 
                        Mavjud kurslarni ko'rish va sotib olish uchun "Kurslar" bo'limiga o'ting.
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={() => navigate('/student/courses')} className="gradient-primary text-primary-foreground">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Kurslarni ko'rish
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Video darslar</h1>
                    <div className="flex items-center gap-2">
                        <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="icon"
                                onClick={() => setViewMode('card')}><LayoutGrid className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon"
                                onClick={() => setViewMode('table')}><Table2 className="h-4 w-4" /></Button>
                    </div>
                </div>
                <p className="text-muted-foreground">Sotib olgan kurslaringiz video darslari</p>
            </div>

            {/* Last Watched Video Card */}
            {lastWatchedVideo && (
                <div 
                    className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-all"
                    onClick={() => navigate(`/student/video/${lastWatchedVideo.id}`)}
                >
                    <div className="flex items-center gap-4">
                        <img 
                            src={lastWatchedVideo.thumbnail || '/placeholder.svg'} 
                            alt={lastWatchedVideo.title}
                            className="w-24 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Oxirgi ko'rilgan dars
                            </p>
                            <h3 className="font-semibold text-foreground">{lastWatchedVideo.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {lastWatchedVideo.category?.icon} {lastWatchedVideo.category?.name}
                            </p>
                        </div>
                        <Button className="gradient-primary text-primary-foreground">
                            Davom etish
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Dars qidirish..." value={search} onChange={(e) => setSearch(e.target.value)}
                           className="pl-10" />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Kursni tanlang" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barcha kurslar</SelectItem>
                        {purchasedCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={(v: FilterType) => setFilterType(v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Holat" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        <SelectItem value="watched">Ko'rilganlar</SelectItem>
                        <SelectItem value="unwatched">Ko'rilmaganlar</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filteredVideos.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {loading ? "Yuklanmoqda..." : "Hech qanday video topilmadi"}
                    </p>
                </div>
            ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredVideos.map((video) => (
                        <div 
                            key={video.id}
                            onClick={() => navigate(`/student/video/${video.id}`)}
                            className={cn(
                                "rounded-xl border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:border-primary/50",
                                isWatched(video.id) ? "border-green-500/30" : "border-border"
                            )}
                        >
                            <div className="relative">
                                <img 
                                    src={video.thumbnail || '/placeholder.svg'} 
                                    alt={video.title}
                                    className="w-full h-40 object-cover"
                                />
                                {isWatched(video.id) && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Ko'rilgan
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <span className="text-xs text-muted-foreground">
                                    {video.category?.icon} {video.category?.name}
                                </span>
                                <h3 className="font-semibold text-card-foreground mt-1 line-clamp-2">{video.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{video.description}</p>
                                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                    <span>{video.duration}</span>
                                    <span>{video.view_count} ko'rish</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <DataTable
                    data={filteredVideos}
                    columns={columns}
                    searchPlaceholder="Dars qidirish..."
                    searchKeys={['title', 'description']}
                    onRowClick={(video) => navigate(`/student/video/${video.id}`)}
                    emptyMessage={loading ? "Yuklanmoqda..." : "Hech qanday video topilmadi"}
                />
            )}
        </DashboardLayout>
    );
}