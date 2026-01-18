import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Upload, FileText } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tasksApi, videosApi, categoriesApi } from '@/services/api';
import { RichTextEditor } from '@/components/RichTextEditor';

interface TaskQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  order: number;
}

interface Video {
  id: string;
  title: string;
  category: string;
  category_name: string;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminTaskCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Get pre-selected values from URL
  const preSelectedCategoryId = searchParams.get('category');
  const preSelectedVideoId = searchParams.get('video');

  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'test' as 'test' | 'file' | 'text',
    category_id: preSelectedCategoryId || '',
    video_id: preSelectedVideoId || '',
    allow_resubmission: false,
    requires_approval: false,
    questions: [] as TaskQuestion[],
  });

  useEffect(() => {
    loadData();
  }, []);

  // Filter videos when category changes
  useEffect(() => {
    if (formData.category_id) {
      const filtered = videos.filter(v => String(v.category) === String(formData.category_id));
      setFilteredVideos(filtered);
      
      // Check if current video is in the filtered list
      if (formData.video_id && !filtered.find(v => String(v.id) === String(formData.video_id))) {
        setFormData(prev => ({ ...prev, video_id: '' }));
      }
    } else {
      setFilteredVideos(videos);
    }
  }, [formData.category_id, videos]);

  const loadData = async () => {
    try {
      const [categoriesRes, videosRes] = await Promise.all([
        categoriesApi.getAll(),
        videosApi.getAll()
      ]);

      const categoriesData = categoriesRes?.results || categoriesRes || [];
      const videosData = videosRes?.results || videosRes || [];

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setVideos(Array.isArray(videosData) ? videosData : []);

      // Set pre-selected category if video is provided
      if (preSelectedVideoId && videosData.length > 0) {
        const selectedVideo = videosData.find((v: Video) => String(v.id) === String(preSelectedVideoId));
        if (selectedVideo) {
          setFormData(prev => ({
            ...prev,
            category_id: String(selectedVideo.category),
            video_id: preSelectedVideoId
          }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Xatolik', description: 'Ma\'lumotlar yuklanmadi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        id: `new-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        order: prev.questions.length + 1
      }]
    }));
  };

  const updateQuestion = (index: number, field: keyof TaskQuestion, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? { ...q, [field]: value } : q)
    }));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => j === oIndex ? value : o) } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Xatolik', description: 'Sarlavhani kiriting', variant: 'destructive' });
      return;
    }

    if (!formData.video_id) {
      toast({ title: 'Xatolik', description: 'Video darsni tanlang', variant: 'destructive' });
      return;
    }

    if (formData.task_type === 'test' && formData.questions.length === 0) {
      toast({ title: 'Xatolik', description: 'Kamida 1 ta savol qo\'shing', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        task_type: formData.task_type,
        video: formData.video_id,
        allow_resubmission: formData.allow_resubmission,
        requires_approval: formData.task_type !== 'test' && formData.requires_approval,
        questions: formData.task_type === 'test' ? formData.questions.map((q, idx) => ({
          question: q.question,
          options: q.options.filter(o => o.trim()),
          correct_answer: q.correct_answer,
          order: idx + 1
        })) : [],
      };

      await tasksApi.create(payload);
      toast({ title: 'Muvaffaqiyat', description: 'Vazifa yaratildi' });
      navigate('/admin/tasks');
    } catch (error) {
      console.error('Error saving task:', error);
      toast({ title: 'Xatolik', description: 'Saqlashda xatolik', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/tasks')} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
          <Save className="mr-2 h-4 w-4" />
          Saqlash
        </Button>
      </div>

      <div className="w-full mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Yangi vazifa yaratish</h1>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-4">Asosiy ma'lumotlar</h2>

            <div className="space-y-2">
              <Label htmlFor="title">Sarlavha *</Label>
              <Input
                id="title"
                placeholder="Vazifa sarlavhasi"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                placeholder="Vazifa tavsifini kiriting..."
              />
            </div>

            <div className="space-y-2">
              <Label>Vazifa turi</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value: 'test' | 'file' | 'text') => setFormData(prev => ({ ...prev, task_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vazifa turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test savollari</SelectItem>
                  <SelectItem value="file">Fayl yuklash</SelectItem>
                  <SelectItem value="text">Matn yozish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Course and Video Selection - Cascading */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-4">Dars tanlash</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kurs *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value, video_id: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Avval kursni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Video dars *</Label>
                <Select
                  value={formData.video_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, video_id: value }))}
                  disabled={!formData.category_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.category_id ? "Video darsni tanlang" : "Avval kursni tanlang"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVideos.map(vid => (
                      <SelectItem key={vid.id} value={String(vid.id)}>
                        {vid.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-4">Sozlamalar</h2>

            <div className="flex items-center justify-between">
              <div>
                <Label>Qayta topshirishga ruxsat</Label>
                <p className="text-xs text-muted-foreground">O'quvchi qayta topshira olsinmi?</p>
              </div>
              <Switch
                checked={formData.allow_resubmission}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_resubmission: checked }))}
              />
            </div>

            {formData.task_type !== 'test' && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>O'qituvchi tasdiqlashi kerak</Label>
                  <p className="text-xs text-muted-foreground">Keyingi darsga o'tish uchun o'qituvchi tasdiqlashi kerakmi?</p>
                </div>
                <Switch
                  checked={formData.requires_approval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: checked }))}
                />
              </div>
            )}
          </div>

          {/* Questions for Test type */}
          {formData.task_type === 'test' && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Savollar ({formData.questions.length})</h2>
                <Button variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="mr-1 h-4 w-4" />
                  Savol qo'shish
                </Button>
              </div>

              {formData.questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Hozircha savollar yo'q</p>
                  <p className="text-sm">Yuqoridagi tugmani bosib savol qo'shing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.questions.map((question, qIndex) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-border bg-muted/30 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Savol {qIndex + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(qIndex)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <Label>Savol matni</Label>
                        <RichTextEditor
                          value={question.question}
                          onChange={(val) => updateQuestion(qIndex, 'question', val)}
                          placeholder="Savol matnini kiriting..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {question.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correct_answer === oIndex}
                              onChange={() => updateQuestion(qIndex, 'correct_answer', oIndex)}
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
              )}
            </div>
          )}

          {/* File/Text task info */}
          {formData.task_type !== 'test' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-4 text-muted-foreground">
                {formData.task_type === 'file' ? (
                  <>
                    <Upload className="h-8 w-8" />
                    <div>
                      <p className="font-medium text-foreground">Fayl yuklash vazifasi</p>
                      <p className="text-sm">O'quvchilar fayl yuklab yoki matn yozib topshira oladi</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="h-8 w-8" />
                    <div>
                      <p className="font-medium text-foreground">Matn yozish vazifasi</p>
                      <p className="text-sm">O'quvchilar yozma javob topshiradi</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
