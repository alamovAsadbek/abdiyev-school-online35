import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, Table2 } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { VideoCard } from '@/components/VideoCard';
import { DataTable, Column } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { videosApi, categoriesApi } from '@/services/api';

type ViewMode = 'card' | 'table';

export default function StudentVideos() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [videos, setVideos] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [videosRes, categoriesRes] = await Promise.all([
        videosApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setVideos(videosRes?.results || videosRes || []);
      setCategories(categoriesRes?.results || categoriesRes || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title?.toLowerCase().includes(search.toLowerCase()) ||
                         video.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns: Column<any>[] = [
    { key: 'title', header: 'Nomi', sortable: true, render: (video) => <div><p className="font-medium">{video.title}</p><p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p></div> },
    { key: 'category', header: 'Kategoriya', render: (video) => <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{video.category?.icon} {video.category?.name}</span> },
    { key: 'duration', header: 'Davomiyligi', sortable: true, render: (video) => video.duration },
    { key: 'view_count', header: 'Ko\'rishlar', sortable: true, render: (video) => `${video.view_count} ta` },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Video darslar</h1>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('card')}><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')}><Table2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <p className="text-muted-foreground">Barcha mavjud video darslar</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Dars qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Kursni tanlang" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kurslar</SelectItem>
            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVideos.map((video) => (
            <div key={video.id}>
              <div className="mb-2 px-2"><span className="text-xs text-muted-foreground">{video.category?.icon} {video.category?.name}</span></div>
              <VideoCard video={video} onClick={() => navigate(`/student/video/${video.id}`)} />
            </div>
          ))}
        </div>
      ) : (
        <DataTable data={filteredVideos} columns={columns} searchPlaceholder="Dars qidirish..." searchKeys={['title', 'description']} onRowClick={(video) => navigate(`/student/video/${video.id}`)} emptyMessage={loading ? "Yuklanmoqda..." : "Hech qanday video topilmadi"} />
      )}
    </DashboardLayout>
  );
}
