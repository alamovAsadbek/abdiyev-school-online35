import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, Calendar, FolderOpen, ClipboardList } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  demoVideos,
  demoTasks,
  getCategoryById,
  getVideoById,
  formatDate,
} from '@/data/demoData';

export default function AdminVideoDetail() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const video = getVideoById(videoId || '');
  const category = video ? getCategoryById(video.categoryId) : null;
  const task = demoTasks.find(t => t.videoId === videoId);

  if (!video) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground mb-4">Video topilmadi</p>
          <Button onClick={() => navigate('/admin/videos')}>Orqaga qaytish</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/admin/videos')} className="mb-6 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Orqaga
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Preview */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={video.videoUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground mb-4">{video.title}</h1>
            <p className="text-muted-foreground mb-6">{video.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Davomiylik</span>
                </div>
                <p className="font-semibold text-foreground">{video.duration}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Ko'rishlar</span>
                </div>
                <p className="font-semibold text-foreground">{video.viewCount}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Qo'shilgan</span>
                </div>
                <p className="font-semibold text-foreground">{formatDate(video.createdAt)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FolderOpen className="h-4 w-4" />
                  <span className="text-sm">Kategoriya</span>
                </div>
                <p className="font-semibold text-foreground">{category?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Task Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Vazifa
            </h3>
            {task ? (
              <div>
                <p className="font-medium mb-2">{task.title}</p>
                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                <p className="text-sm text-muted-foreground">
                  {task.questions.length} ta savol
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/admin/tasks`)}
                >
                  Vazifani ko'rish
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">Bu videoga vazifa biriktirilmagan</p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/tasks')}
                >
                  Vazifa qo'shish
                </Button>
              </div>
            )}
          </div>

          {/* Thumbnail Preview */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-card-foreground mb-4">Thumbnail</h3>
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
