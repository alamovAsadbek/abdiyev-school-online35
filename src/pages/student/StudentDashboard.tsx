import { useNavigate } from 'react-router-dom';
import { Video, FolderOpen, ClipboardList, Trophy, TrendingUp, Clock } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { VideoCard } from '@/components/VideoCard';
import { CategoryCard } from '@/components/CategoryCard';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { demoVideos, demoCategories } from '@/data/demoData';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { progress } = useProgress();
  const navigate = useNavigate();

  const recentVideos = demoVideos.slice(0, 4);
  const totalVideos = demoVideos.length;
  const completedVideos = progress.completedVideos.length;
  const progressPercent = Math.round((completedVideos / totalVideos) * 100);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Xush kelibsiz, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bugungi o'quv jarayoningizni davom ettiring
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <StatCard
            icon={Video}
            label="Ko'rilgan videolar"
            value={`${completedVideos}/${totalVideos}`}
            color="primary"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <StatCard
            icon={TrendingUp}
            label="Progress"
            value={`${progressPercent}%`}
            color="success"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            icon={ClipboardList}
            label="Bajarilgan vazifalar"
            value={progress.completedTasks.length}
            color="accent"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <StatCard
            icon={Trophy}
            label="O'rtacha ball"
            value="85%"
            color="warning"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 p-5 rounded-xl border border-border bg-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-card-foreground">Umumiy progress</h3>
          <span className="text-sm text-muted-foreground">{progressPercent}% yakunlandi</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full gradient-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Kategoriyalar</h2>
          <button 
            onClick={() => navigate('/student/categories')}
            className="text-sm text-primary hover:underline"
          >
            Hammasini ko'rish
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoCategories.map((category, index) => (
            <div key={category.id} className="animate-fade-in" style={{ animationDelay: `${0.35 + index * 0.05}s` }}>
              <CategoryCard
                category={category}
                onClick={() => navigate(`/student/category/${category.id}`)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Videos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">So'nggi darslar</h2>
          <button 
            onClick={() => navigate('/student/videos')}
            className="text-sm text-primary hover:underline"
          >
            Hammasini ko'rish
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentVideos.map((video, index) => (
            <div key={video.id} className="animate-fade-in" style={{ animationDelay: `${0.5 + index * 0.05}s` }}>
              <VideoCard
                video={video}
                onClick={() => navigate(`/student/video/${video.id}`)}
              />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
