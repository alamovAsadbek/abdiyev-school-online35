import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Upload, FileText, Image as ImageIcon, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
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
  image?: File | null;
  imagePreview?: string;
  explanation?: string;
  showExplanation?: boolean;
  optionExplanations?: string[];
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

  const preSelectedCategoryId = searchParams.get('category');
  const preSelectedVideoId = searchParams.get('video');

  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Answer file state
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const answerFileRef = useRef<HTMLInputElement>(null);

  // Existing task on selected video
  const [existingTask, setExistingTask] = useState<any>(null);
  const [checkingTask, setCheckingTask] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'test' as 'test' | 'file' | 'text',
    category_id: preSelectedCategoryId || '',
    video_id: preSelectedVideoId || '',
    allow_resubmission: false,
    requires_approval: false,
    questions: [] as TaskQuestion[],
    has_answer_file: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      const filtered = videos.filter(v => String(v.category) === String(formData.category_id));
      setFilteredVideos(filtered);
      if (formData.video_id && !filtered.find(v => String(v.id) === String(formData.video_id))) {
        setFormData(prev => ({ ...prev, video_id: '' }));
      }
    } else {
      setFilteredVideos(videos);
    }
  }, [formData.category_id, videos]);

  // Check if selected video already has a task
  useEffect(() => {
    if (formData.video_id) {
      setCheckingTask(true);
      tasksApi.getByVideo(formData.video_id)
        .then(data => {
          const task = Array.isArray(data) ? data[0] : (data?.results?.[0] || data);
          if (task && task.id) {
            setExistingTask(task);
          } else {
            setExistingTask(null);
          }
        })
        .catch(() => setExistingTask(null))
        .finally(() => setCheckingTask(false));
    } else {
      setExistingTask(null);
    }
  }, [formData.video_id]);

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
        order: prev.questions.length + 1,
        image: null,
        imagePreview: '',
        explanation: '',
        showExplanation: false,
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

  const handleQuestionImageChange = (qIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          questions: prev.questions.map((q, i) =>
            i === qIndex ? { ...q, image: file, imagePreview: reader.result as string } : q
          )
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQuestionImage = (qIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex ? { ...q, image: null, imagePreview: '' } : q
      )
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
      // Use FormData if there are question images or answer file
      const hasImages = formData.questions.some(q => q.image);
      
      if (hasImages || answerFile) {
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('description', formData.description);
        fd.append('task_type', formData.task_type);
        fd.append('video', formData.video_id);
        fd.append('allow_resubmission', String(formData.allow_resubmission));
        fd.append('requires_approval', String(formData.task_type !== 'test' && formData.requires_approval));
        
        if (answerFile) {
          fd.append('answer_file', answerFile);
        }
        
        if (formData.task_type === 'test') {
          const questionsData = formData.questions.map((q, idx) => ({
            question: q.question,
            options: q.options.filter(o => o.trim()),
            correct_answer: q.correct_answer,
            order: idx + 1,
            has_image: !!q.image,
            description: q.explanation || '',
          }));
          fd.append('questions', JSON.stringify(questionsData));
          
          // Append question images
          formData.questions.forEach((q, idx) => {
            if (q.image) {
              fd.append(`question_image_${idx}`, q.image);
            }
          });
        }
        
        await tasksApi.create(fd);
      } else {
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
            order: idx + 1,
            description: q.explanation || '',
          })) : [],
        };

        await tasksApi.create(payload);
      }
      
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

          {/* Course and Video Selection */}
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

          {/* Existing task warning */}
          {checkingTask && formData.video_id && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span className="text-sm text-muted-foreground">Tekshirilmoqda...</span>
            </div>
          )}
          {existingTask && (
            <div className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Bu darsga avval vazifa yuklangan!</h3>
                  <p className="text-sm text-muted-foreground">Yangi vazifa yaratish uchun avval mavjud vazifani o'chiring</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{existingTask.title}</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                    {existingTask.task_type === 'test' ? 'Test' : existingTask.task_type === 'file' ? 'Fayl' : 'Matn'}
                  </span>
                </div>
                {existingTask.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{existingTask.description?.replace(/<[^>]+>/g, '')}</p>
                )}
                {existingTask.questions?.length > 0 && (
                  <p className="text-xs text-muted-foreground">{existingTask.questions.length} ta savol</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/tasks/${existingTask.id}`)}
                  >
                    <Eye className="mr-1 h-4 w-4" /> Ko'rish
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (confirm('Bu vazifani o\'chirishni xohlaysizmi?')) {
                        try {
                          await tasksApi.delete(existingTask.id);
                          setExistingTask(null);
                          toast({ title: 'Muvaffaqiyat', description: 'Vazifa o\'chirildi' });
                        } catch {
                          toast({ title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive' });
                        }
                      }
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> O'chirish
                  </Button>
                </div>
              </div>
            </div>
          )}

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

          {/* Answer File Section */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Savol-javob fayli</h2>
                <p className="text-sm text-muted-foreground">
                  Vazifa bajarilgandan keyin o'quvchiga ko'rsatiladigan javoblar fayli. Yuklab olish va skrinshot qilish mumkin emas.
                </p>
              </div>
              <Switch
                checked={formData.has_answer_file}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_answer_file: checked }))}
              />
            </div>

            {formData.has_answer_file && (
              <div className="space-y-3">
                <input
                  ref={answerFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAnswerFile(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => answerFileRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {answerFile ? answerFile.name : 'Javob faylini tanlang (PDF, Word, Rasm)'}
                </Button>
                {answerFile && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{answerFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(answerFile.size / 1024)}KB)
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAnswerFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <EyeOff className="h-4 w-4 flex-shrink-0" />
                    Bu fayl faqat vazifani bajargandan keyin ko'rsatiladi. O'quvchi uni yuklab ololmaydi va skrinshot qila olmaydi.
                  </p>
                </div>
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

                      {/* Question Image Upload */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Savol rasmi (ixtiyoriy)
                        </Label>
                        {question.imagePreview ? (
                          <div className="relative max-w-sm">
                            <img
                              src={question.imagePreview}
                              alt={`Savol ${qIndex + 1} rasmi`}
                              className="w-full rounded-lg border border-border"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-background/80 hover:bg-background h-8 w-8"
                              onClick={() => removeQuestionImage(qIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`q-image-${qIndex}`}
                              onChange={(e) => handleQuestionImageChange(qIndex, e)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`q-image-${qIndex}`)?.click()}
                            >
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Rasm yuklash
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Per-answer explanation toggle */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Javob tushuntirishi (ixtiyoriy)</Label>
                          <Switch
                            checked={question.showExplanation || false}
                            onCheckedChange={(checked) => updateQuestion(qIndex, 'showExplanation', checked)}
                          />
                        </div>
                        {question.showExplanation && (
                          <p className="text-xs text-muted-foreground">Har bitta javob varianti uchun tushuntirish yozing</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {question.options.map((opt, oIndex) => (
                          <div key={oIndex} className="space-y-1">
                            <div className="flex items-center gap-2">
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
                            {question.showExplanation && (
                              <div className="ml-6">
                                <Textarea
                                  placeholder={`${String.fromCharCode(65 + oIndex)} varianti uchun tushuntirish...`}
                                  value={(question as any).optionExplanations?.[oIndex] || ''}
                                  onChange={(e) => {
                                    const explanations = [...((question as any).optionExplanations || ['', '', '', ''])];
                                    explanations[oIndex] = e.target.value;
                                    updateQuestion(qIndex, 'optionExplanations' as any, explanations);
                                  }}
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
                            )}
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

          {/* File/Text task content */}
          {formData.task_type !== 'test' && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                {formData.task_type === 'file' ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Fayl yuklash vazifasi</h2>
                      <p className="text-sm text-muted-foreground">O'quvchilar fayl yuklab topshiradi</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Matn yozish vazifasi</h2>
                      <p className="text-sm text-muted-foreground">O'quvchilar yozma javob topshiradi</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Vazifa ko'rsatmalari (ixtiyoriy)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  O'quvchilarga qo'shimcha ko'rsatmalar yoki namuna yozing. Kimyoviy formulalar uchun pastki/yuqori indeksdan foydalaning.
                </p>
                <RichTextEditor
                  value={formData.description}
                  onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                  placeholder={formData.task_type === 'file' 
                    ? "Masalan: Quyidagi reaksiya tenglamasini yozing va fayl sifatida yuklang..."
                    : "Masalan: H₂SO₄ + NaOH → Na₂SO₄ + H₂O reaksiyasini tahlil qiling..."
                  }
                  className="min-h-[200px]"
                />
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30">
                <p className="text-sm text-muted-foreground text-center">
                  {formData.task_type === 'file' 
                    ? "📎 O'quvchilar bu vazifa uchun fayl yuklab topshiradi"
                    : "✏️ O'quvchilar bu vazifa uchun matn yozib topshiradi"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
