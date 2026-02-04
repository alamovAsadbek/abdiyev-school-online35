import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Video, FolderOpen, ClipboardList, Trophy, TrendingUp} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {StatCard} from '@/components/StatCard';
import {VideoCard} from '@/components/VideoCard';
import {CategoryCard} from '@/components/CategoryCard';
import {useAuth} from '@/contexts/AuthContext';
import {useProgress} from '@/contexts/ProgressContext';
import {videosApi, categoriesApi, userCoursesApi} from '@/services/api';

export default function StudentDashboard() {
    const {user} = useAuth();
    const {completedVideos, completedTasks} = useProgress();
    const navigate = useNavigate();
    const [accessibleVideos, setAccessibleVideos] = useState<any[]>([]);
    const [accessibleCategories, setAccessibleCategories] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get user's accessible courses
            const [myCoursesRes, categoriesRes, videosRes] = await Promise.all([
                userCoursesApi.getMyCourses(),
                categoriesApi.getAll(),
                videosApi.getAll(),
            ]);
            
            const myCourses = myCoursesRes?.results || myCoursesRes || [];
            const categories = categoriesRes?.results || categoriesRes || [];
            const allVideos = videosRes?.results || videosRes || [];
            
            setAllCategories(categories);
            
            // Filter categories that user has access to
            const accessibleCategoryIds = myCourses.map((c: any) => String(c.category?.id || c.category));
            const userCategories = categories.filter((cat: any) => accessibleCategoryIds.includes(String(cat.id)));
            setAccessibleCategories(userCategories);
            
            // Filter videos from accessible categories only
            // Also check module access for modular courses
            const userVideos: any[] = [];
            
            for (const video of allVideos) {
                const categoryId = String(video.category);
                const userCourse = myCourses.find((c: any) => String(c.category?.id || c.category) === categoryId);
                
                if (!userCourse) continue; // User doesn't have this course
                
                // Check if video's module is accessible
                if (video.module) {
                    const moduleIds = (userCourse.modules_detail || userCourse.modules || []).map((m: any) => String(m.id || m));
                    if (moduleIds.length > 0 && !moduleIds.includes(String(video.module))) {
                        continue; // Module not accessible
                    }
                }
                
                userVideos.push(video);
            }
            
            setAccessibleVideos(userVideos.slice(0, 4));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalVideos = accessibleVideos.length || 1;
    const completedVideosCount = completedVideos.length;
    const progressPercent = totalVideos > 0 ? Math.round((completedVideosCount / totalVideos) * 100) : 0;

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
                <StatCard icon={TrendingUp} label="Progress" value={`${Math.min(progressPercent, 100)}%`} color="success"/>
                <StatCard icon={ClipboardList} label="Bajarilgan vazifalar" value={completedTasks.length}
                          color="accent"/>
                <StatCard icon={Trophy} label="Kurslar" value={accessibleCategories.length}
                          color="warning"/>
            </div>

            <div className="mb-8 p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-card-foreground">Umumiy progress</h3>
                    <span className="text-sm text-muted-foreground">{Math.min(progressPercent, 100)}% yakunlandi</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full gradient-primary rounded-full transition-all duration-500"
                         style={{width: `${Math.min(progressPercent, 100)}%`}}/>
                </div>
            </div>

            {/* User's accessible categories */}
            {accessibleCategories.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-foreground">Sizning kurslaringiz</h2>
                        <button onClick={() => navigate('/student/categories')}
                                className="text-sm text-primary hover:underline">Hammasini ko'rish
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {accessibleCategories.slice(0, 4).map((category) => (
                            <CategoryCard key={category.id} category={category}
                                          onClick={() => navigate(`/student/category/${category.id}`)}/>
                        ))}
                    </div>
                </div>
            )}

            {/* Available videos from user's courses */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Sizning darslaringiz</h2>
                    <button onClick={() => navigate('/student/videos')}
                            className="text-sm text-primary hover:underline">Hammasini ko'rish
                    </button>
                </div>
                {loading ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                        <p className="text-muted-foreground">Yuklanmoqda...</p>
                    </div>
                ) : accessibleVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {accessibleVideos.map((video) => (
                            <VideoCard key={video.id} video={video} onClick={() => navigate(`/student/video/${video.id}`)}/>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                        <p className="text-muted-foreground">
                            Sizga hali hech qanday kurs berilmagan yoki sotib olmadingiz. Kurslarni ko'rib xarid qiling!
                        </p>
                        <button 
                            onClick={() => navigate('/student/categories')}
                            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Kurslarni ko'rish
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
