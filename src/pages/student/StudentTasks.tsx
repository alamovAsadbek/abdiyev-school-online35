import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, Table2, PlayCircle, Lock } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { TaskCard } from '@/components/TaskCard';
import { DataTable, Column } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProgress } from '@/contexts/ProgressContext';
import { useToast } from '@/hooks/use-toast';
import { demoTasks, demoVideos, demoCategories, Task } from '@/data/demoData';

type ViewMode = 'card' | 'table';
type FilterStatus = 'all' | 'available' | 'completed' | 'locked';

export default function StudentTasks() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const navigate = useNavigate();
  const { progress, isVideoCompleted } = useProgress();
  const { toast } = useToast();

  const isTaskLocked = (task: Task) => {
    const video = demoVideos.find(v => v.id === task.videoId);
    return video ? !isVideoCompleted(video.id) : true;
  };

  const filteredTasks = demoTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
                         task.description.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const isCompleted = progress.completedTasks.includes(task.id);
    const isLocked = isTaskLocked(task);

    switch (filterStatus) {
      case 'available':
        return !isLocked && !isCompleted;
      case 'completed':
        return isCompleted;
      case 'locked':
        return isLocked;
      default:
        return true;
    }
  });

  const handleTaskClick = (task: Task) => {
    if (isTaskLocked(task)) {
      const video = demoVideos.find(v => v.id === task.videoId);
      toast({
        title: "Vazifa qulflangan",
        description: "Bu vazifani bajarish uchun avval tegishli video darsni ko'rishingiz kerak.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/student/task/${task.id}`);
  };

  const getTaskStatus = (task: Task) => {
    const isCompleted = progress.completedTasks.includes(task.id);
    const isLocked = isTaskLocked(task);
    const canRetake = task.allowResubmission;
    
    if (isLocked) {
      return 'locked';
    }
    if (isCompleted && !canRetake) {
      return 'completed';
    } else if (isCompleted && canRetake) {
      return 'retakeable';
    }
    return 'new';
  };

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Vazifa',
      sortable: true,
      render: (task) => {
        const video = demoVideos.find(v => v.id === task.videoId);
        const category = video ? demoCategories.find(c => c.id === video.categoryId) : null;
        const isLocked = isTaskLocked(task);
        return (
          <div className={isLocked ? 'opacity-60' : ''}>
            <p className="font-medium text-foreground">{task.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              {category && <span>{category.icon}</span>}
              <span>{category?.name}</span>
              <span>•</span>
              <span>{video?.title}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'questions',
      header: 'Savollar',
      render: (task) => `${task.questions.length} ta savol`,
    },
    {
      key: 'allowResubmission',
      header: 'Qayta topshirish',
      render: (task) => (
        <span className={`status-badge ${task.allowResubmission ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
          {task.allowResubmission ? 'Ruxsat berilgan' : 'Yo\'q'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      render: (task) => {
        const status = getTaskStatus(task);
        const isCompleted = progress.completedTasks.includes(task.id);
        
        if (status === 'locked') {
          return (
            <span className="status-badge bg-muted text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mr-1" />
              Qulflangan
            </span>
          );
        }
        
        return (
          <span className={`status-badge ${
            isCompleted ? 'status-completed' : 'status-new'
          }`}>
            {status === 'completed' ? 'Tugatilgan' : 
             status === 'retakeable' ? 'Qayta topshirish mumkin' : 'Yangi'}
          </span>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Vazifalar
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
          Video darslarga tegishli barcha vazifalar
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Vazifa qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Holat bo'yicha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="available">Mavjud</SelectItem>
            <SelectItem value="completed">Tugatilgan</SelectItem>
            <SelectItem value="locked">Qulflangan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content - Card or Table View */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task, index) => {
            const video = demoVideos.find(v => v.id === task.videoId);
            const category = video ? demoCategories.find(c => c.id === video.categoryId) : null;
            const isLocked = isTaskLocked(task);
            
            return (
              <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                {/* Task Info Header */}
                <div 
                  className={`mb-2 p-3 rounded-lg border border-border bg-card/50 ${!isLocked ? 'cursor-pointer hover:bg-card transition-colors' : 'opacity-60'}`}
                  onClick={() => video && !isLocked && navigate(`/student/video/${video.id}`)}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {category && (
                      <>
                        <span className="text-base">{category.icon}</span>
                        <span>{category.name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="truncate">{video?.title}</span>
                    {!isLocked && <PlayCircle className="h-3.5 w-3.5 text-primary ml-auto flex-shrink-0" />}
                    {isLocked && <Lock className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
                  </div>
                </div>
                <div className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
                  <TaskCard
                    task={task}
                    onClick={() => handleTaskClick(task)}
                  />
                </div>
                {isLocked && (
                  <p className="mt-2 text-xs text-warning flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Avval videoni ko'ring
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="animate-fade-in">
          <DataTable
            data={filteredTasks}
            columns={columns}
            searchPlaceholder="Vazifa qidirish..."
            searchKeys={['title', 'description']}
            onRowClick={(task) => handleTaskClick(task)}
            emptyMessage="Hech qanday vazifa topilmadi"
          />
        </div>
      )}

      {filteredTasks.length === 0 && viewMode === 'card' && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-muted-foreground">
            {search || filterStatus !== 'all' ? "Hech qanday vazifa topilmadi" : "Hali vazifalar yo'q"}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}