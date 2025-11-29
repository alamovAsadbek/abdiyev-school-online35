import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, Table2 } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { VideoCard } from '@/components/VideoCard';
import { DataTable, Column } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { demoVideos, demoCategories, Video } from '@/data/demoData';

type ViewMode = 'card' | 'table';

export default function StudentVideos() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const navigate = useNavigate();

  const filteredVideos = demoVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase()) ||
                         video.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || video.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns: Column<Video>[] = [
    {
      key: 'title',
      header: 'Nomi',
      sortable: true,
      render: (video) => (
        <div>
          <p className="font-medium text-foreground">{video.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>
        </div>
      ),
    },
    {
      key: 'categoryId',
      header: 'Kategoriya',
      render: (video) => {
        const category = demoCategories.find(c => c.id === video.categoryId);
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {category?.icon} {category?.name}
          </span>
        );
      },
    },
    {
      key: 'duration',
      header: 'Davomiyligi',
      sortable: true,
      render: (video) => video.duration,
    },
    {
      key: 'viewCount',
      header: 'Ko\'rishlar',
      sortable: true,
      render: (video) => `${video.viewCount} ta`,
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Video darslar
          </h1>
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
        <p className="text-muted-foreground">
          Barcha mavjud video darslar
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Dars qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Hammasi
          </button>
          {demoCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content - Card or Table View */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVideos.map((video, index) => (
            <div key={video.id} className="animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.03}s` }}>
              <VideoCard
                video={video}
                onClick={() => navigate(`/student/video/${video.id}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in">
          <DataTable
            data={filteredVideos}
            columns={columns}
            searchPlaceholder="Dars qidirish..."
            searchKeys={['title', 'description']}
            onRowClick={(video) => navigate(`/student/video/${video.id}`)}
            emptyMessage="Hech qanday video topilmadi"
          />
        </div>
      )}

      {filteredVideos.length === 0 && viewMode === 'card' && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-muted-foreground">Hech qanday video topilmadi</p>
        </div>
      )}
    </DashboardLayout>
  );
}
