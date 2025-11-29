import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Clock, Eye } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column, Filter } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { demoVideos, demoCategories, Video, getCategoryById, formatDate } from '@/data/demoData';

export default function AdminVideos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>(demoVideos);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = () => {
    if (videoToDelete) {
      const updatedVideos = videos.filter(v => v.id !== videoToDelete);
      setVideos(updatedVideos);
      localStorage.setItem('abdiyev_videos', JSON.stringify(updatedVideos));
      setVideoToDelete(null);
      toast({ title: 'O\'chirildi', description: 'Video o\'chirildi' });
    }
  };

  const columns: Column<Video>[] = [
    {
      key: 'title',
      header: 'Video',
      render: (video) => (
        <div className="flex items-center gap-3">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-12 w-20 rounded-lg object-cover"
          />
          <div>
            <p className="font-medium text-card-foreground line-clamp-1">{video.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'categoryId',
      header: 'Kategoriya',
      render: (video) => {
        const category = getCategoryById(video.categoryId);
        return (
          <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
            {category?.icon} {category?.name}
          </span>
        );
      },
    },
    {
      key: 'duration',
      header: 'Davomiylik',
      render: (video) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {video.duration}
        </div>
      ),
    },
    {
      key: 'viewCount',
      header: 'Ko\'rishlar',
      sortable: true,
      render: (video) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Eye className="h-4 w-4" />
          {video.viewCount}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Qo\'shilgan',
      sortable: true,
      render: (video) => formatDate(video.createdAt),
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
            onClick={(e) => {
              e.stopPropagation();
              setVideoToDelete(video.id);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filters: Filter[] = [
    {
      key: 'categoryId',
      label: 'Kategoriya',
      options: demoCategories.map(cat => ({
        value: cat.id,
        label: `${cat.icon} ${cat.name}`,
      })),
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Video darslar
          </h1>
          <p className="text-muted-foreground">
            Video darslarni boshqaring
          </p>
        </div>
        <Button 
          onClick={() => navigate('/admin/videos/add')} 
          className="gradient-primary text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yangi video
        </Button>
      </div>

      {/* Data Table */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={videos}
          columns={columns}
          filters={filters}
          searchPlaceholder="Video nomi bo'yicha qidirish..."
          searchKeys={['title', 'description']}
          onRowClick={(video) => navigate(`/admin/videos/${video.id}`)}
          emptyMessage="Videolar topilmadi"
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!videoToDelete}
        onOpenChange={(open) => !open && setVideoToDelete(null)}
        title="Videoni o'chirish"
        description="Rostdan ham bu videoni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
