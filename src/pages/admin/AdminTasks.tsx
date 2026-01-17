import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, HelpCircle } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column, Filter } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tasksApi, videosApi, categoriesApi } from '@/services/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate } from "@/lib/utils";

interface TaskQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  video: {
    id: string;
    title: string;
    category: {
      id: string;
      name: string;
    };
  };
  questions: TaskQuestion[];
  allow_resubmission: boolean;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  category: {
    id: string;
    name: string;
  };
}

export default function AdminTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_id: '',
    allow_resubmission: false,
    questions: [] as { id: string; question: string; options: string[]; correct_answer: number }[],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, videosRes] = await Promise.all([
        tasksApi.getAll(),
        videosApi.getAll(),
      ]);

      const tasksData = tasksRes?.results || tasksRes || [];
      const videosData = videosRes?.results || videosRes || [];

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setVideos(Array.isArray(videosData) ? videosData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Xatolik',
        description: 'Ma\'lumotlarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        video_id: task.video.id,
        allow_resubmission: task.allow_resubmission,
        questions: task.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: [...q.options],
          correct_answer: q.correct_answer,
        })),
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        video_id: '',
        allow_resubmission: false,
        questions: [],
      });
    }
    setIsDialogOpen(true);
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => j === oIndex ? value : o) }
          : q
      ),
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.video_id || formData.questions.length === 0) {
      toast({ title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring va kamida 1 ta savol qo\'shing', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        video: formData.video_id,
        allow_resubmission: formData.allow_resubmission,
        questions: formData.questions,
      };

      if (editingTask) {
        await tasksApi.update(editingTask.id, payload);
        toast({ title: 'Muvaffaqiyat', description: 'Vazifa yangilandi' });
      } else {
        await tasksApi.create(payload);
        toast({ title: 'Muvaffaqiyat', description: 'Yangi vazifa qo\'shildi' });
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Saqlashda xatolik',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (taskToDelete) {
      try {
        await tasksApi.delete(taskToDelete);
        setTasks(prev => prev.filter(t => t.id !== taskToDelete));
        toast({ title: 'O\'chirildi', description: 'Vazifa o\'chirildi' });
      } catch (error) {
        toast({
          title: 'Xatolik',
          description: 'O\'chirishda xatolik',
          variant: 'destructive',
        });
      } finally {
        setTaskToDelete(null);
      }
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Vazifa',
      render: (task) => (
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/admin/tasks/${task.id}`)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-card-foreground hover:text-primary transition">{task.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'video',
      header: 'Video',
      render: (task) => (
        <div>
          <p className="text-sm font-medium">{task.video?.title || 'Noma\'lum'}</p>
          <p className="text-xs text-muted-foreground">{task.video?.category?.name}</p>
        </div>
      ),
    },
    {
      key: 'questions',
      header: 'Savollar',
      render: (task) => `${task.questions?.length || 0} ta`,
    },
    {
      key: 'allow_resubmission',
      header: 'Qayta topshirish',
      render: (task) => (
        <span className={`status-badge ${task.allow_resubmission ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
          {task.allow_resubmission ? 'Ha' : 'Yo\'q'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Yaratilgan',
      sortable: true,
      render: (task) => formatDate(task.created_at),
    },
    {
      key: 'actions',
      header: 'Amallar',
      render: (task) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/tasks/${task.id}`);
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
              setTaskToDelete(task.id);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Vazifalar
          </h1>
          <p className="text-muted-foreground">
            Test savollarini boshqaring
          </p>
        </div>
        <Button 
          onClick={() => navigate('/admin/tasks/create')} 
          className="gradient-primary text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yangi vazifa
        </Button>
      </div>

      {/* Data Table */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={tasks}
          columns={columns}
          searchPlaceholder="Vazifa nomi bo'yicha qidirish..."
          searchKeys={['title', 'description']}
          emptyMessage={loading ? "Yuklanmoqda..." : "Vazifalar topilmadi"}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        title="Vazifani o'chirish"
        description="Rostdan ham bu vazifani o'chirmoqchimisiz?"
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
