import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, LayoutGrid, Table2, Clock, CheckCircle2, Lock, Filter } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { VideoCard } from '@/components/VideoCard';
import { DataTable, Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { demoCategories, demoVideos, Video } from '@/data/demoData';
import { useProgress } from '@/contexts/ProgressContext';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'card' | 'table';
type FilterStatus = 'all' | 'completed' | 'not-completed' | 'locked';

export default function StudentCategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { isVideoCompleted } = useProgress();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const category = demoCategories.find(c => c.id === categoryId);
  const allVideos = demoVideos.filter(v => v.categoryId === categoryId).sort((a, b) => a.order - b.order);

  // Check if video is locked (previous video not completed)
  const isVideoLocked = (video: Video): boolean => {
    const videoIndex = allVideos.findIndex(v => v.id === video.id);
    if (videoIndex === 0) return false; // First video is always unlocked
    
    const previousVideo = allVideos[videoIndex - 1];
    return !isVideoCompleted(previousVideo.id);
  };

  // Filter videos
  const filteredVideos = allVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase()) ||
                         video.description.toLowerCase().includes(search.toLowerCase());
    
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

  const handleVideoClick = (video: Video) => {
    if (isVideoLocked(video)) {
      toast({
        title: "Video qulflangan",
        description: "Bu videoni ko'rish uchun avvalgi darslarni tugatishingiz kerak.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/student/video/${video.id}`);
  };

  const columns: Column<Video>[] = [
    {
      key: 'order',
      header: '№',
      sortable: true,
      render: (video) => (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
          {video.order}
        </span>
      ),
    },
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
            <div key={video.id} className="animate-fade-in" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
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
            columns={columns}
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