import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    ArrowLeft, Pencil, Trash2, Plus, Save, X,
    ClipboardList, Video, Copy, Check, GripVertical, ChartSpline
} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {Badge} from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {useToast} from '@/hooks/use-toast';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {tasksApi, videosApi} from '@/services/api';
import {RichTextEditor} from '@/components/RichTextEditor';

interface TaskQuestion {
    id: string | number;
    question: string;
    options: string[];
    correct_answer: number;
    order: number;
}

interface Task {
    id: number;
    title: string;
    description: string;
    task_type: string;
    video: number;
    questions: TaskQuestion[];
    allow_resubmission: boolean;
    requires_approval: boolean;
    created_at: string;
}

interface VideoItem {
    id: string;
    title: string;
    category_name: string;
}

export default function AdminTaskDetail() {
    const {taskId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();

    const [task, setTask] = useState<Task | null>(null);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState('');
    const [linking, setLinking] = useState(false);

    // Edit form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        allow_resubmission: false,
        questions: [] as TaskQuestion[],
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [taskId]);

    const loadData = async () => {
        try {
            const [taskData, videosData] = await Promise.all([
                tasksApi.getById(taskId!),
                videosApi.getAll()
            ]);

            setTask(taskData);
            setVideos(videosData?.results || videosData || []);

            // Initialize form data
            setFormData({
                title: taskData.title,
                description: taskData.description || '',
                allow_resubmission: taskData.allow_resubmission,
                questions: taskData.questions?.map((q: any, idx: number) => ({
                    id: q.id,
                    question: q.question,
                    options: [...q.options],
                    correct_answer: q.correct_answer,
                    order: idx + 1
                })) || [],
            });
        } catch (error) {
            console.error('Error loading task:', error);
            toast({title: 'Xatolik', description: 'Ma\'lumotlar yuklanmadi', variant: 'destructive'});
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast({title: 'Xatolik', description: 'Sarlavhani kiriting', variant: 'destructive'});
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                allow_resubmission: formData.allow_resubmission,
                questions: formData.questions.map((q, idx) => ({
                    question: q.question,
                    options: q.options.filter(o => o.trim()),
                    correct_answer: q.correct_answer,
                    order: idx + 1
                })),
            };

            await tasksApi.update(taskId!, payload);
            toast({title: 'Muvaffaqiyat', description: 'Vazifa yangilandi'});
            setIsEditing(false);
            loadData();
        } catch (error) {
            toast({title: 'Xatolik', description: 'Saqlashda xatolik', variant: 'destructive'});
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await tasksApi.delete(taskId!);
            toast({title: 'O\'chirildi', description: 'Vazifa o\'chirildi'});
            navigate('/admin/tasks');
        } catch (error) {
            toast({title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive'});
        }
    };

    const handleLinkToVideo = async () => {
        if (!selectedVideoId) {
            toast({title: 'Xatolik', description: 'Videoni tanlang', variant: 'destructive'});
            return;
        }

        setLinking(true);
        try {
            await tasksApi.linkToVideo(taskId!, selectedVideoId);
            toast({title: 'Muvaffaqiyat', description: 'Vazifa boshqa videoga ham qo\'shildi'});
            setShowLinkDialog(false);
            setSelectedVideoId('');
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || 'Xatolik yuz berdi';
            toast({title: 'Xatolik', description: errorMessage, variant: 'destructive'});
        } finally {
            setLinking(false);
        }
    };

    // Question management
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
            questions: prev.questions.map((q, i) => i === index ? {...q, [field]: value} : q)
        }));
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === qIndex ? {...q, options: q.options.map((o, j) => j === oIndex ? value : o)} : q
            )
        }));
    };

    const removeQuestion = (index: number) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
                </div>
            </DashboardLayout>
        );
    }

    if (!task) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground mb-4">Vazifa topilmadi</p>
                    <Button onClick={() => navigate('/admin/tasks')}>Orqaga qaytish</Button>
                </div>
            </DashboardLayout>
        );
    }

    // Find video for this task
    const taskVideo = videos.find(v => String(v.id) === String(task.video));

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate('/admin/tasks')} className="-ml-2">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Orqaga
                </Button>

                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                <X className="mr-2 h-4 w-4"/>
                                Bekor qilish
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                <Save className="mr-2 h-4 w-4"/>
                                Saqlash
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setShowLinkDialog(true)}>
                                <Copy className="mr-2 h-4 w-4"/>
                                Boshqa darsga ulash
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 h-4 w-4"/>
                                Tahrirlash
                            </Button>
                            <Button variant="outline" onClick={() => navigate(`/admin/tasks/${taskId}/stats`)}>
                                <ChartSpline/>
                                Statistika
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-destructive hover:bg-destructive hover:text-white"
                            >
                                <Trash2 className="mr-2 h-4 w-4"/>
                                O'chirish
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="w-full mx-auto">
                {/* Task Info */}
                <div className="rounded-xl border border-border bg-card p-6 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ClipboardList className="h-6 w-6"/>
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                                    className="text-xl font-bold mb-2"
                                    placeholder="Vazifa sarlavhasi"
                                />
                            ) : (
                                <h1 className="text-2xl font-bold text-foreground mb-2">{task.title}</h1>
                            )}

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Video className="h-4 w-4"/>
                                <span>{taskVideo?.title || 'Noma\'lum video'}</span>
                            </div>
                        </div>
                        <Badge variant="outline">
                            {task.task_type === 'test' ? 'Test' :
                                task.task_type === 'file' ? 'Fayl yuklash' : 'Matn'}
                        </Badge>
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <Label>Tavsif</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                                    placeholder="Vazifa tavsifi"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Qayta topshirishga ruxsat</Label>
                                    <p className="text-xs text-muted-foreground">O'quvchi qayta topshira olsinmi?</p>
                                </div>
                                <Switch
                                    checked={formData.allow_resubmission}
                                    onCheckedChange={(checked) => setFormData(prev => ({
                                        ...prev,
                                        allow_resubmission: checked
                                    }))}
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            {task.description && (
                                <p className="text-muted-foreground mb-4">{task.description}</p>
                            )}
                            <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  Qayta topshirish: {task.allow_resubmission ?
                    <span className="text-green-600">Ruxsat berilgan</span> :
                    <span className="text-destructive">Ruxsat yo'q</span>}
                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Questions */}
                {task.task_type === 'test' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Savollar ({isEditing ? formData.questions.length : task.questions?.length || 0})
                            </h2>
                            {isEditing && (
                                <Button variant="outline" size="sm" onClick={addQuestion}>
                                    <Plus className="mr-1 h-4 w-4"/>
                                    Savol qo'shish
                                </Button>
                            )}
                        </div>

                        {(isEditing ? formData.questions : task.questions)?.map((question, qIndex) => (
                            <div
                                key={question.id}
                                className="rounded-xl border border-border bg-card p-5"
                            >
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="h-4 w-4 text-muted-foreground"/>
                                                <span className="font-medium">Savol {qIndex + 1}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeQuestion(qIndex)}
                                                className="h-8 w-8 text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4"/>
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
                                ) : (
                                    <div>
                                        <div className="flex items-start gap-3 mb-4">
                      <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                        {qIndex + 1}
                      </span>
                                            <div
                                                className="flex-1 prose prose-sm dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={{__html: question.question}}
                                            />
                                        </div>

                                        <div className="space-y-2 pl-11">
                                            {question.options.map((option, oIndex) => (
                                                <div
                                                    key={oIndex}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                                        question.correct_answer === oIndex
                                                            ? 'border-green-500 bg-green-500/10'
                                                            : 'border-border bg-muted/30'
                                                    }`}
                                                >
                          <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium ${
                                  question.correct_answer === oIndex
                                      ? 'border-green-500 bg-green-500 text-white'
                                      : 'border-muted-foreground/30'
                              }`}>
                            {question.correct_answer === oIndex ?
                                <Check className="h-4 w-4"/> : String.fromCharCode(65 + oIndex)}
                          </span>
                                                    <span className="flex-1">{option}</span>
                                                    {question.correct_answer === oIndex && (
                                                        <span className="text-xs text-green-600">To'g'ri javob</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Link to Video Dialog */}
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Vazifani boshqa darsga ulash</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                            Bu vazifaning nusxasi tanlanagan darsga ham qo'shiladi.
                        </p>
                        <div className="space-y-2">
                            <Label>Videoni tanlang</Label>
                            <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Darsni tanlang"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {videos
                                        .filter(v => String(v.id) !== String(task.video))
                                        .map(vid => (
                                            <SelectItem key={vid.id} value={String(vid.id)}>
                                                {vid.title} - {vid.category_name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                                Bekor qilish
                            </Button>
                            <Button onClick={handleLinkToVideo} disabled={linking}>
                                <Copy className="mr-2 h-4 w-4"/>
                                Ulash
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Vazifani o'chirish"
                description="Rostdan ham bu vazifani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </DashboardLayout>
    );
}