import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Video, FolderOpen, ClipboardList, Trophy, TrendingUp} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {StatCard} from '@/components/StatCard';
import {VideoCard} from '@/components/VideoCard';
import {CategoryCard} from '@/components/CategoryCard';
import {useAuth} from '@/contexts/AuthContext';
import {useProgress} from '@/contexts/ProgressContext';
import {videosApi, categoriesApi} from '@/services/api';
import {api} from "@/lib/api.ts";

export default function StudentDashboard() {
    const {user} = useAuth();
    const {completedVideos, completedTasks} = useProgress();
    const navigate = useNavigate();
    const [videos, setVideos] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [videosRes, categoriesRes] = await Promise.all([
                videosApi.getAll(),
                categoriesApi.getAll(),
            ]);
            setVideos((videosRes?.results || videosRes || []).slice(0, 4));
            setCategories(categoriesRes?.results || categoriesRes || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalVideos = videos.length || 1;
    const completedVideosCount = completedVideos.length;
    const progressPercent = Math.round((completedVideosCount / totalVideos) * 100);

    return (
        <DashboardLayout>
            <div className="mb-8 animate-fade-in">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                    Xush kelibsiz, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-muted-foreground">Bugungi o'quv jarayoningizni davom ettiring</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Video} label="Ko'rilgan videolar" value={`${completedVideosCount}/${totalVideos}`}
                          color="primary"/>
                <StatCard icon={TrendingUp} label="Progress" value={`${progressPercent}%`} color="success"/>
                <StatCard icon={ClipboardList} label="Bajarilgan vazifalar" value={completedTasks.length}
                          color="accent"/>
                <StatCard icon={Trophy} label="O'rtacha ball" value="85%" color="warning"/>
            </div>

            <div className="mb-8 p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-card-foreground">Umumiy progress</h3>
                    <span className="text-sm text-muted-foreground">{progressPercent}% yakunlandi</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full gradient-primary rounded-full transition-all duration-500"
                         style={{width: `${progressPercent}%`}}/>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Kategoriyalar</h2>
                    <button onClick={() => navigate('/student/categories')}
                            className="text-sm text-primary hover:underline">Hammasini ko'rish
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categories.map((category) => (
                        <CategoryCard key={category.id} category={category}
                                      onClick={() => navigate(`/student/category/${category.id}`)}/>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">So'nggi darslar</h2>
                    <button onClick={() => navigate('/student/videos')}
                            className="text-sm text-primary hover:underline">Hammasini ko'rish
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {videos.map((video) => (
                        <VideoCard key={video.id} video={video} onClick={() => navigate(`/student/video/${video.id}`)}/>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
