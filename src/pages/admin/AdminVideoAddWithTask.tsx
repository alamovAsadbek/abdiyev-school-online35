import {useState, useRef, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    X,
    Image as ImageIcon,
    AlertTriangle,
    Plus,
    Trash2,
    Check,
    GripVertical,
    FileText
} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Switch} from '@/components/ui/switch';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {useToast} from '@/hooks/use-toast';
import {videosApi, categoriesApi, tasksApi} from '@/services/api';
import {RichTextEditor} from '@/components/RichTextEditor';

const MAX_VIDEO_SIZE = 150 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ['video/mp4'];

interface TaskQuestion {
    id: string;
    question: string;
    image?: File | null;
    imagePreview?: string;
    options: string[];
    correctAnswer: number;
}

export default function AdminVideoAddWithTask() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedCategory = searchParams.get('category');
    const {toast} = useToast();
    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // Step state
    const [currentStep, setCurrentStep] = useState(1);
    const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);

    // Video form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: preSelectedCategory || '',
        duration: '',
        videoUrl: '',
        thumbnail: '',
    });

    // Task/Test settings
    const [taskType, setTaskType] = useState<'none' | 'file' | 'text' | 'test'>('none');
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        allowResubmission: true,
    });
    const [taskFile, setTaskFile] = useState<File | null>(null);
    const [questions, setQuestions] = useState<TaskQuestion[]>([]);

    const [categories, setCategories] = useState<any[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'url'>('upload');
    const [isLoading, setIsLoading] = useState(false);
    const [videoError, setVideoError] = useState<string>('');

    useEffect(() => {
        categoriesApi.getAll()
            .then(data => {
                setCategories(data?.results || []);
            })
            .catch(console.error);
    }, []);

    const validateVideoFile = (file: File): boolean => {
        setVideoError('');
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
            setVideoError('Faqat MP4 formatdagi videolar qabul qilinadi');
            return false;
        }
        if (file.size > MAX_VIDEO_SIZE) {
            const sizeMB = Math.round(file.size / (1024 * 1024));
            setVideoError(`Video hajmi ${sizeMB}MB. Maksimal hajm 150MB`);
            return false;
        }
        return true;
    };

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!validateVideoFile(file)) {
                e.target.value = '';
                return;
            }
            setVideoFile(file);
            setVideoError('');
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                const duration = video.duration;
                const minutes = Math.floor(duration / 60);
                const seconds = Math.floor(duration % 60);
                setFormData(prev => ({...prev, duration: `${minutes}:${seconds.toString().padStart(2, '0')}`}));
            };
            video.src = URL.createObjectURL(file);
        }
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setThumbnailPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Question management
    const addQuestion = () => {
        setQuestions(prev => [...prev, {
            id: `q-${Date.now()}`,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            image: null,
            imagePreview: '',
        }]);
    };

    const updateQuestion = (index: number, field: keyof TaskQuestion, value: any) => {
        setQuestions(prev => prev.map((q, i) => i === index ? {...q, [field]: value} : q));
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        setQuestions(prev => prev.map((q, i) =>
            i === qIndex ? {...q, options: q.options.map((o, j) => j === oIndex ? value : o)} : q
        ));
    };

    const removeQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleQuestionImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateQuestion(index, 'image', file);
                updateQuestion(index, 'imagePreview', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveVideo = async () => {
        if (!formData.title.trim() || !formData.categoryId) {
            toast({title: 'Xatolik', description: 'Sarlavha va kategoriyani to\'ldiring', variant: 'destructive'});
            return;
        }
        if (!videoFile) {
            toast({title: 'Xatolik', description: 'Video faylni yuklang', variant: 'destructive'});
            return;
        }
        if (!thumbnailFile && !formData.thumbnail) {
            toast({title: 'Xatolik', description: 'Thumbnail yuklang yoki URL kiriting', variant: 'destructive'});
            return;
        }

        setIsLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('category', formData.categoryId);
            formDataToSend.append('duration', formData.duration || '0:00');
            formDataToSend.append('video_file', videoFile);

            if (thumbnailFile) {
                formDataToSend.append('thumbnail_file', thumbnailFile);
            } else if (formData.thumbnail) {
                formDataToSend.append('thumbnail_url', formData.thumbnail);
            }

            const response = await videosApi.create(formDataToSend);
            setCreatedVideoId(response.id);
            toast({title: 'Muvaffaqiyat', description: 'Video qo\'shildi'});
            setCurrentStep(2);
        } catch (error: any) {
            toast({title: 'Xatolik', description: error.message || 'Video saqlashda xatolik', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTask = async () => {
        if (taskType === 'none') {
            navigate('/admin/videos');
            return;
        }

        if (taskType === 'test') {
            if (!taskData.title.trim()) {
                toast({title: 'Xatolik', description: 'Test sarlavhasini kiriting', variant: 'destructive'});
                return;
            }
            if (questions.length === 0) {
                toast({title: 'Xatolik', description: 'Kamida 1 ta savol qo\'shing', variant: 'destructive'});
                return;
            }
            // Validate each question
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.question.trim()) {
                    toast({title: 'Xatolik', description: `${i + 1}-savol matni kiritilmagan`, variant: 'destructive'});
                    return;
                }
                const validOptions = q.options.filter(o => o.trim());
                if (validOptions.length < 2) {
                    toast({
                        title: 'Xatolik',
                        description: `${i + 1}-savol uchun kamida 2 ta variant kerak`,
                        variant: 'destructive'
                    });
                    return;
                }
            }
        }

        setIsLoading(true);
        try {
            const payload: any = {
                title: taskData.title,
                description: taskData.description,
                video: createdVideoId,
                allow_resubmission: taskData.allowResubmission,
            };
            if (taskType === 'test') {
                payload.questions = questions.map((q, idx) => ({
                    question: q.question,
                    options: q.options.filter(o => o.trim()),
                    correct_answer: q.correctAnswer,
                    order: idx + 1,
                }));
            }

            await tasksApi.create(payload);
            toast({title: 'Muvaffaqiyat', description: 'Vazifa qo\'shildi'});
            navigate('/admin/videos');
        } catch (error: any) {
            toast({title: 'Xatolik', description: error.message || 'Vazifa saqlashda xatolik', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipTask = () => {
        navigate('/admin/videos');
    };

    return (
        <DashboardLayout>
            <div className="w-full mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate('/admin/videos')}>
                        <ArrowLeft className="h-4 w-4"/>
                    </Button>
                    <div className="animate-fade-in">
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                            Yangi video qo'shish
                        </h1>
                        <p className="text-muted-foreground">
                            {currentStep === 1 ? 'Video ma\'lumotlarini kiriting' : 'Vazifa qo\'shing (ixtiyoriy)'}
                        </p>
                    </div>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center gap-4 mb-8">
                    <div
                        className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {currentStep > 1 ? <Check className="h-4 w-4"/> : '1'}
                        </div>
                        <span className="font-medium">Video yuklash</span>
                    </div>
                    <div className="flex-1 h-px bg-border"/>
                    <div
                        className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            2
                        </div>
                        <span className="font-medium">Vazifa qo'shish</span>
                    </div>
                </div>

                {/* Step 1: Video Upload */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Basic Info */}
                        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Asosiy ma'lumotlar</h2>
                            <div className="space-y-2">
                                <Label htmlFor="title">Sarlavha <span className='text-destructive'>*</span></Label>
                                <Input
                                    id="title"
                                    placeholder="Video sarlavhasi"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Kategoriya <span className='text-destructive'>*</span></Label>
                                <Select value={formData.categoryId}
                                        onValueChange={(value) => setFormData(prev => ({...prev, categoryId: value}))}>
                                    <SelectTrigger><SelectValue placeholder="Kategoriyani tanlang"/></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id}
                                                        value={String(cat.id)}>{cat.icon} {cat.name}</SelectItem>
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
                                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Video Upload */}
                        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Video</h2>
                            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                                <p className="text-sm text-warning flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0"/>
                                    <span>Faqat MP4 formatda, maksimal hajmi 150MB</span>
                                </p>
                            </div>

                            <input ref={videoInputRef} type="file" accept="video/mp4" className="hidden"
                                   onChange={handleVideoFileChange}/>
                            <Button type="button" variant="outline"
                                    className={`w-full ${videoError ? 'border-destructive' : ''}`}
                                    onClick={() => videoInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4"/>
                                {videoFile ? videoFile.name : 'Video tanlang (MP4)'}
                            </Button>
                            {videoError && <p className="text-sm text-destructive">{videoError}</p>}

                            {/* Video metadata after file selected */}
                            {videoFile && (
                                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                                    <h3 className="font-medium text-sm text-foreground">Video ma'lumotlari</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Fayl nomi: </span>
                                            <span className="text-foreground">{videoFile.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Hajmi: </span>
                                            <span
                                                className="text-foreground">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Format: </span>
                                            <span className="text-foreground">{videoFile.type}</span>
                                        </div>
                                        {formData.duration && (
                                            <div>
                                                <span className="text-muted-foreground">Davomiylik: </span>
                                                <span className="text-foreground">{formData.duration}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail */}
                        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Thumbnail</h2>
                            <Tabs value={thumbnailMode} onValueChange={(v) => setThumbnailMode(v as 'upload' | 'url')}
                                  className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="upload">Rasm yuklash</TabsTrigger>
                                    <TabsTrigger value="url">URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload" className="space-y-4 mt-4">
                                    <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden"
                                           onChange={handleThumbnailFileChange}/>
                                    <Button type="button" variant="outline" className="w-full"
                                            onClick={() => thumbnailInputRef.current?.click()}>
                                        <ImageIcon className="mr-2 h-4 w-4"/>
                                        {thumbnailFile ? thumbnailFile.name : 'Rasm tanlang'}
                                    </Button>
                                    {thumbnailPreview && <img src={thumbnailPreview} alt="Preview"
                                                              className="w-40 h-24 object-cover rounded-lg"/>}
                                </TabsContent>
                                <TabsContent value="url" className="space-y-4 mt-4">
                                    <Input
                                        placeholder="https://..."
                                        value={formData.thumbnail}
                                        onChange={(e) => {
                                            setFormData(prev => ({...prev, thumbnail: e.target.value}));
                                            setThumbnailPreview(e.target.value);
                                        }}
                                    />
                                    {thumbnailPreview && <img src={thumbnailPreview} alt="Preview"
                                                              className="w-40 h-24 object-cover rounded-lg"/>}
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => navigate('/admin/videos')}>Bekor qilish</Button>
                            <Button onClick={handleSaveVideo} disabled={isLoading}
                                    className="gradient-primary text-primary-foreground">
                                {isLoading ? 'Yuklanmoqda...' : 'Keyingi qadam'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Task Creation */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                            <h2 className="text-lg font-semibold text-foreground">Vazifa turini tanlang</h2>

                            <RadioGroup value={taskType} onValueChange={(v) => setTaskType(v as typeof taskType)}
                                        className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    {value: 'none', label: 'Vazifa yo\'q', desc: 'Keyinroq qo\'shaman'},
                                    {value: 'test', label: 'Test', desc: 'Ko\'p tanlovli savollar'},
                                    {value: 'text', label: 'Matn', desc: 'Tavsif yozish'},
                                    {value: 'file', label: 'Fayl', desc: 'PDF/Doc yuklash'},
                                ].map(opt => (
                                    <label key={opt.value}
                                           className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all ${taskType === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                        <RadioGroupItem value={opt.value} className="sr-only"/>
                                        <span className="font-medium text-foreground">{opt.label}</span>
                                        <span className="text-xs text-muted-foreground text-center">{opt.desc}</span>
                                    </label>
                                ))}
                            </RadioGroup>
                        </div>

                        {taskType !== 'none' && (
                            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                                <h2 className="text-lg font-semibold text-foreground">Vazifa ma'lumotlari</h2>
                                <div className="space-y-2">
                                    <Label>Sarlavha *</Label>
                                    <Input
                                        placeholder="Vazifa sarlavhasi"
                                        value={taskData.title}
                                        onChange={(e) => setTaskData(prev => ({...prev, title: e.target.value}))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tavsif</Label>
                                    {(taskType === 'text' || taskType === 'test') ? (
                                        <RichTextEditor
                                            value={taskData.description}
                                            onChange={(value) => setTaskData(prev => ({...prev, description: value}))}
                                            placeholder="Vazifa haqida qisqacha... Kimyoviy formulalar uchun subscript/superscript ishlating"
                                        />
                                    ) : (
                                        <Textarea
                                            placeholder="Vazifa haqida qisqacha"
                                            value={taskData.description}
                                            onChange={(e) => setTaskData(prev => ({
                                                ...prev,
                                                description: e.target.value
                                            }))}
                                        />
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Qayta topshirishga ruxsat</Label>
                                        <p className="text-xs text-muted-foreground">O'quvchi testni qayta topshira
                                            olsinmi?</p>
                                    </div>
                                    <Switch checked={taskData.allowResubmission}
                                            onCheckedChange={(checked) => setTaskData(prev => ({
                                                ...prev,
                                                allowResubmission: checked
                                            }))}/>
                                </div>
                            </div>
                        )}

                        {/* File Upload Section */}
                        {taskType === 'file' && (
                            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                                <h2 className="text-lg font-semibold text-foreground">Fayl yuklash</h2>
                                <p className="text-sm text-muted-foreground">
                                    O'quvchilar yuklab olishi kerak bo'lgan fayl (PDF, Word, Excel va boshqalar)
                                </p>

                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                    className="hidden"
                                    id="task-file-input"
                                    onChange={(e) => setTaskFile(e.target.files?.[0] || null)}
                                />

                                <div
                                    onClick={() => document.getElementById('task-file-input')?.click()}
                                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                >
                                    {taskFile ? (
                                        <div className="space-y-2">
                                            <FileText className="h-12 w-12 mx-auto text-primary"/>
                                            <p className="font-medium text-foreground">{taskFile.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(taskFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTaskFile(null);
                                                }}
                                            >
                                                <X className="mr-1 h-4 w-4"/> O'chirish
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-12 w-12 mx-auto text-muted-foreground"/>
                                            <p className="font-medium text-foreground">Fayl yuklash uchun bosing</p>
                                            <p className="text-sm text-muted-foreground">
                                                PDF, Word, Excel, PowerPoint
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Test Questions */}
                        {taskType === 'test' && (
                            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-foreground">Savollar</h2>
                                    <Button variant="outline" size="sm" onClick={addQuestion}>
                                        <Plus className="mr-1 h-4 w-4"/>Savol qo'shish
                                    </Button>
                                </div>

                                {questions.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Hali savol qo'shilmagan. "Savol qo'shish" tugmasini bosing.
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {questions.map((q, qIndex) => (
                                        <div key={q.id}
                                             className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="h-5 w-5 text-muted-foreground"/>
                                                    <span className="font-medium">Savol {qIndex + 1}</span>
                                                </div>
                                                <Button variant="ghost" size="icon"
                                                        onClick={() => removeQuestion(qIndex)}
                                                        className="h-8 w-8 text-destructive">
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Savol matni *</Label>
                                                <RichTextEditor
                                                    value={q.question}
                                                    onChange={(value) => updateQuestion(qIndex, 'question', value)}
                                                    placeholder="Savolni kiriting... Kimyoviy formulalar uchun subscript ishlating"
                                                    className="min-h-[100px]"
                                                />
                                            </div>

                                            {/* Question image */}
                                            <div className="space-y-2">
                                                <Label>Savol uchun rasm (ixtiyoriy)</Label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        id={`q-image-${qIndex}`}
                                                        onChange={(e) => handleQuestionImage(qIndex, e)}
                                                    />
                                                    <Button type="button" variant="outline" size="sm"
                                                            onClick={() => document.getElementById(`q-image-${qIndex}`)?.click()}>
                                                        <ImageIcon className="mr-2 h-4 w-4"/>Rasm yuklash
                                                    </Button>
                                                    {q.imagePreview && (
                                                        <div className="relative">
                                                            <img src={q.imagePreview} alt=""
                                                                 className="w-20 h-12 object-cover rounded"/>
                                                            <button onClick={() => {
                                                                updateQuestion(qIndex, 'image', null);
                                                                updateQuestion(qIndex, 'imagePreview', '');
                                                            }}
                                                                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center">
                                                                <X className="h-3 w-3"/>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Options */}
                                            <div className="space-y-2">
                                                <Label>Javob variantlari (to'g'ri javobni belgilang)</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {q.options.map((opt, oIndex) => (
                                                        <div key={oIndex} className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${qIndex}`}
                                                                checked={q.correctAnswer === oIndex}
                                                                onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                                                className="accent-primary h-4 w-4"
                                                            />
                                                            <Input
                                                                placeholder={`Variant ${String.fromCharCode(65 + oIndex)}`}
                                                                value={opt}
                                                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                                className={q.correctAnswer === oIndex ? 'border-success' : ''}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Radioni belgilash orqali
                                                    to'g'ri javobni tanlang</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between gap-3">
                            <Button variant="ghost" onClick={handleSkipTask}>O'tkazib yuborish</Button>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setCurrentStep(1)}>Orqaga</Button>
                                <Button onClick={handleSaveTask} disabled={isLoading}
                                        className="gradient-primary text-primary-foreground">
                                    {isLoading ? 'Saqlanmoqda...' : taskType === 'none' ? 'Tugatish' : 'Saqlash'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
