import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft, CheckCircle2, Clock, ChevronRight, ClipboardList, Lock} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {useProgress} from '@/contexts/ProgressContext';
import {useAuth} from '@/contexts/AuthContext';
import {useToast} from '@/hooks/use-toast';
import {videosApi, tasksApi, userCoursesApi, categoriesApi} from '@/services/api';
import {SecureVideoPlayer} from '@/components/SecureVideoPlayer';

interface Video {
    id: string;
    title: string;
    description: string;
    duration: string;
    video_url: string;
    thumbnail: string;
    category: string;
    order: number;
}

interface Task {
    id: string;
    title: string;
    description: string;
    video: string;
    questions?: { id: string }[];
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

export default function StudentVideoView() {
    const {videoId} = useParams();
    const navigate = useNavigate();
    const {user} = useAuth();
    const {markVideoCompleted, isVideoCompleted} = useProgress();
    const {toast} = useToast();

    const [video, setVideo] = useState<Video | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [task, setTask] = useState<Task | null>(null);
    const [categoryVideos, setCategoryVideos] = useState([]);
    const [hasWatched, setHasWatched] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    const completed = video ? isVideoCompleted(video.id) : false;

    const currentIndex = categoryVideos.findIndex(v => v.id === videoId);
    const nextVideo = currentIndex >= 0 && currentIndex < categoryVideos.length - 1
        ? categoryVideos[currentIndex + 1]
        : null;


    // Check if a video is locked (previous not completed)
    const isVideoLocked = (targetVideoId: string): boolean => {
        const targetIndex = categoryVideos.findIndex(v => v.id === targetVideoId);
        if (targetIndex === 0) return false;
        const previousVideo = categoryVideos[targetIndex - 1];
        return !isVideoCompleted(previousVideo);
    };

    const currentVideoLocked = video ? isVideoLocked(video.id) : false;

    useEffect(() => {
        const fetchData = async () => {
            if (!videoId) return;

            setLoading(true);
            try {
                // Fetch video
                const videoData = await videosApi.getById(videoId);
                setVideo(videoData);

                // Check if user has access to this course
                const myCourses = await userCoursesApi.getMyCourses();
                const courses = myCourses?.results || myCourses || [];
                const hasAccessToCourse = courses.some(
                    (c: any) => {
                        const courseCategory = c.category_id || c.categoryId || c.category;
                        return String(courseCategory) === String(videoData.category);
                    }
                );
                setHasAccess(hasAccessToCourse);

                if (!hasAccessToCourse) {
                    setLoading(false);
                    return;
                }

                // Fetch category
                if (videoData.category) {
                    const categoryData = await categoriesApi.getById(String(videoData.category));
                    setCategory(categoryData);

                    // Fetch all videos in category
                    const videosInCategory = await videosApi.getByCategory(String(videoData.category));
                    const videos = videosInCategory?.results || videosInCategory || [];
                    setCategoryVideos(videos.sort((a: Video, b: Video) => a.order - b.order));
                }

                // Fetch task for this video
                try {
                    const tasksData = await tasksApi.getByVideo(videoId);
                    const tasks = tasksData?.results || tasksData || [];
                    if (tasks.length > 0) {
                        setTask(tasks[0]);
                    }
                } catch {
                    // No task for this video
                }

                // Increment view count
                videosApi.incrementView(videoId).catch(() => {
                });

            } catch (error) {
                console.error('Failed to fetch video data:', error);
                toast({
                    title: 'Xatolik',
                    description: 'Video ma\'lumotlarini yuklashda xatolik',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [videoId, toast]);

    // Auto mark as watched after 10 seconds
    useEffect(() => {
        if (video && !completed && !currentVideoLocked && hasAccess) {
            const timer = setTimeout(() => {
                setHasWatched(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [video, completed, currentVideoLocked, hasAccess]);

    const handleMarkCompleted = () => {
        if (video) {
            markVideoCompleted(video.id);
        }
    };

    const handleTaskClick = () => {
        if (!completed) {
            toast({
                title: "Video ko'rilmagan",
                description: "Vazifani bajarish uchun avval videoni ko'rishingiz kerak.",
                variant: "destructive"
            });
            return;
        }
        if (task) {
            navigate(`/student/task/${task.id}`);
        }
    };

    const handleVideoClick = (targetVideoId: string) => {
        if (isVideoLocked(targetVideoId)) {
            toast({
                title: "Video qulflangan",
                description: "Bu videoni ko'rish uchun avvalgi darslarni tugatishingiz kerak.",
                variant: "destructive"
            });
            return;
        }
        navigate(`/student/video/${targetVideoId}`);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
                </div>
            </DashboardLayout>
        );
    }

    if (!hasAccess) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground mb-4 text-center">
                        Siz bu kursni sotib olmagansiz. Videoni ko'rish uchun avval kursni sotib oling.
                    </p>
                    <Button onClick={() => navigate('/student/courses')}>
                        Kurslarga o'tish
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    if (!video || currentVideoLocked) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground mb-4">
                        {currentVideoLocked ? "Bu video qulflangan. Avvalgi darslarni tugatishingiz kerak." : "Video topilmadi"}
                    </p>
                    <Button onClick={() => navigate('/student/videos')}>
                        Orqaga qaytish
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-6 -ml-2"
            >
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Orqaga
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Video Player */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="animate-fade-in">
                        {/* Secure Video Player with Watermark */}
                        <SecureVideoPlayer
                            videoUrl={video.video_url}
                            title={video.title}
                            watermarkId={user?.watermark_id || user?.id?.toString().slice(-8).toUpperCase() || 'USER'}
                            onComplete={handleMarkCompleted}
                        />

                        {/* Video Info */}
                        <div className="mt-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                                        {video.title}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4"/>
                        {video.duration}
                    </span>
                                        {category && (
                                            <span
                                                className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {category.name}
                      </span>
                                        )}
                                    </div>
                                </div>

                                {completed ? (
                                    <div className="status-badge status-completed">
                                        <CheckCircle2 className="h-4 w-4"/>
                                        Ko'rildi
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleMarkCompleted}
                                        className="gradient-primary text-primary-foreground"
                                        disabled={!hasWatched}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4"/>
                                        {hasWatched ? 'Ko\'rildi deb belgilash' : 'Videoni ko\'ring...'}
                                    </Button>
                                )}
                            </div>

                            <p className="text-muted-foreground">
                                {video.description}
                            </p>

                            {/* Protection Notice */}
                            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                                <p className="text-xs text-warning flex items-center gap-2">
                                    <Lock className="h-3 w-3"/>
                                    Bu video himoyalangan. Skrinshot olish va ekran yozish taqiqlangan. Sizning
                                    ID: {user?.watermark_id || user?.id?.toString().slice(-8).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Task Card */}
                    {task && (
                        <div className="animate-fade-in rounded-xl border border-border bg-card p-5"
                             style={{animationDelay: '0.1s'}}>
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${completed ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                                    {completed ? <ClipboardList className="h-5 w-5"/> : <Lock className="h-5 w-5"/>}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-card-foreground">Vazifa</h3>
                                    <p className="text-xs text-muted-foreground">{task.questions?.length || 0} ta
                                        savol</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                            {!completed && (
                                <p className="text-xs text-warning mb-3 flex items-center gap-1">
                                    <Lock className="h-3 w-3"/>
                                    Vazifani bajarish uchun avval videoni ko'ring
                                </p>
                            )}
                            <Button
                                onClick={handleTaskClick}
                                className="w-full"
                                variant={completed ? "outline" : "secondary"}
                                disabled={!completed}
                            >
                                {completed ? "Vazifani bajarish" : "Qulflangan"}
                                <ChevronRight className="ml-2 h-4 w-4"/>
                            </Button>
                        </div>
                    )}

                    {/* Next Video */}
                    {nextVideo && (
                        <div className="animate-fade-in rounded-xl border border-border bg-card p-5"
                             style={{animationDelay: '0.15s'}}>
                            <h3 className="font-semibold text-card-foreground mb-4">Keyingi dars</h3>
                            <div
                                className={`group ${isVideoLocked(nextVideo.id) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={() => handleVideoClick(nextVideo.id)}
                            >
                                <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                                    <img
                                        src={nextVideo.thumbnail}
                                        alt={nextVideo.title}
                                        className={`w-full h-full object-cover transition-transform duration-300 ${isVideoLocked(nextVideo.id) ? 'opacity-50' : 'group-hover:scale-105'}`}
                                    />
                                    <div
                                        className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"/>
                                    {isVideoLocked(nextVideo.id) && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/90 text-muted-foreground">
                                                <Lock className="h-5 w-5"/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <h4 className={`font-medium transition-colors ${isVideoLocked(nextVideo.id) ? 'text-muted-foreground' : 'text-card-foreground group-hover:text-primary'}`}>
                                    {nextVideo.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">{nextVideo.duration}</p>
                                {isVideoLocked(nextVideo.id) && (
                                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
                                        <Lock className="h-3 w-3"/>
                                        Bu darsni ochish uchun joriy darsni tugatishingiz kerak
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Other Videos in Category */}
                    <div className="animate-fade-in rounded-xl border border-border bg-card p-5"
                         style={{animationDelay: '0.2s'}}>
                        <h3 className="font-semibold text-card-foreground mb-4">Bu bo'limdagi boshqa darslar</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {categoryVideos.map((v) => {
                                const locked = isVideoLocked(v.id);
                                const isCompleted = isVideoCompleted(v.id);

                                return (
                                    <div
                                        key={v.id}
                                        onClick={() => v.id !== videoId && handleVideoClick(v.id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${v.id === videoId
                                            ? 'bg-primary/10 text-primary'
                                            : locked
                                                ? 'cursor-not-allowed opacity-60'
                                                : 'hover:bg-muted cursor-pointer'
                                        }`}
                                    >
                    <span
                        className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${locked ? 'bg-muted/50' : 'bg-muted'}`}>
                      {locked ? <Lock className="h-3 w-3"/> : v.order}
                    </span>
                                        <span className="flex-1 text-sm truncate">{v.title}</span>
                                        {isCompleted && (
                                            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0"/>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}