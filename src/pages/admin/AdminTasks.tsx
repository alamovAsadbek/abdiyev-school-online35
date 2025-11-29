import { useState } from 'react';
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
import { demoTasks, demoVideos, demoCategories, Task, TaskQuestion, getVideoById, getCategoryById, formatDate } from '@/data/demoData';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoId: '',
    allowResubmission: false,
    questions: [] as TaskQuestion[],
  });
  const { toast } = useToast();

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        videoId: task.videoId,
        allowResubmission: task.allowResubmission,
        questions: [...task.questions],
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        videoId: '',
        allowResubmission: false,
        questions: [],
      });
    }
    setIsDialogOpen(true);
  };

  const addQuestion = () => {
    const newQuestion: TaskQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (index: number, field: keyof TaskQuestion, value: any) => {
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

  const handleSave = () => {
    if (!formData.title.trim() || !formData.videoId || formData.questions.length === 0) {
      toast({ title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring va kamida 1 ta savol qo\'shing', variant: 'destructive' });
      return;
    }

    if (editingTask) {
      setTasks(prev => prev.map(t =>
        t.id === editingTask.id
          ? { ...t, ...formData }
          : t
      ));
      toast({ title: 'Muvaffaqiyat', description: 'Vazifa yangilandi' });
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTasks(prev => [...prev, newTask]);
      toast({ title: 'Muvaffaqiyat', description: 'Yangi vazifa qo\'shildi' });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: 'O\'chirildi', description: 'Vazifa o\'chirildi' });
  };

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Vazifa',
      render: (task) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-card-foreground">{task.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'videoId',
      header: 'Video',
      render: (task) => {
        const video = getVideoById(task.videoId);
        const category = video ? getCategoryById(video.categoryId) : null;
        return (
          <div>
            <p className="text-sm font-medium">{video?.title || 'Noma\'lum'}</p>
            <p className="text-xs text-muted-foreground">{category?.name}</p>
          </div>
        );
      },
    },
    {
      key: 'questions',
      header: 'Savollar',
      render: (task) => `${task.questions.length} ta`,
    },
    {
      key: 'allowResubmission',
      header: 'Qayta topshirish',
      render: (task) => (
        <span className={`status-badge ${task.allowResubmission ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
          {task.allowResubmission ? 'Ha' : 'Yo\'q'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Yaratilgan',
      sortable: true,
      render: (task) => formatDate(task.createdAt),
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
              handleOpenDialog(task);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleDelete(task.id, e)}
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Yangi vazifa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Vazifani tahrirlash' : 'Yangi vazifa'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 overflow-y-auto flex-1 pr-2">
              <div className="space-y-2">
                <Label htmlFor="title">Sarlavha</Label>
                <Input
                  id="title"
                  placeholder="Vazifa sarlavhasi"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video">Video dars</Label>
                <Select
                  value={formData.videoId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, videoId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Videoni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {demoVideos.map(vid => (
                      <SelectItem key={vid.id} value={vid.id}>
                        {vid.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea
                  id="description"
                  placeholder="Qisqacha tavsif"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Qayta topshirishga ruxsat</Label>
                  <p className="text-xs text-muted-foreground">O'quvchi testni qayta topshira olsinmi?</p>
                </div>
                <Switch
                  checked={formData.allowResubmission}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowResubmission: checked }))}
                />
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Savollar</Label>
                  <Button variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="mr-1 h-3 w-3" />
                    Savol qo'shish
                  </Button>
                </div>

                {formData.questions.map((q, qIndex) => (
                  <div key={q.id} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Savol {qIndex + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(qIndex)}
                        className="h-7 w-7 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Savol matni"
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctAnswer === oIndex}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                            className="accent-primary"
                          />
                          <Input
                            placeholder={`Variant ${String.fromCharCode(65 + oIndex)}`}
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">To'g'ri javobni belgilang</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Bekor qilish</Button>
                <Button onClick={handleSave} className="gradient-primary text-primary-foreground">Saqlash</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={tasks}
          columns={columns}
          searchPlaceholder="Vazifa nomi bo'yicha qidirish..."
          searchKeys={['title', 'description']}
          emptyMessage="Vazifalar topilmadi"
        />
      </div>
    </DashboardLayout>
  );
}
