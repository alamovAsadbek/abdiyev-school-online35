import {useState, useRef, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft, Upload, X, Image as ImageIcon, AlertTriangle} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {useToast} from '@/hooks/use-toast';
import {demoCategories, demoVideos, Video} from '@/data/demoData';
import {videosApi, categoriesApi} from '@/services/api';

const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150MB in bytes
const ALLOWED_VIDEO_TYPES = ['video/mp4'];

export default function AdminVideoAdd() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const preSelectedCategory = searchParams.get('category');
    const {toast} = useToast();
    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        duration: '',
        videoUrl: '',
        thumbnail: '',
        homeworkTitle: '',
        homeworkDescription: '',
    });

    const [categories, setCategories] = useState(demoCategories);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'url'>('upload');
    const [homeworkFile, setHomeworkFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [videoError, setVideoError] = useState<string>('');
    const homeworkInputRef = useRef<HTMLInputElement>(null);

    // Load categories from API
    useEffect(() => {
        categoriesApi.getAll()
            .then(data => {
                setCategories(data?.results);
            })
            .catch((err) => {
                console.log(err)
            });
    }, []);

    // Load video data if editing or set pre-selected category
    useEffect(() => {
        if (preSelectedCategory && !editId) {
            setFormData(prev => ({...prev, categoryId: preSelectedCategory}));
        }

        if (editId) {
            const existingVideos = JSON.parse(localStorage.getItem('abdiyev_videos') || JSON.stringify(demoVideos));
            const videoToEdit = existingVideos.find((v: Video) => v.id === editId);
            if (videoToEdit) {
                setFormData({
                    title: videoToEdit.title,
                    description: videoToEdit.description,
                    categoryId: videoToEdit.categoryId,
                    duration: videoToEdit.duration,
                    videoUrl: videoToEdit.videoUrl,
                    thumbnail: videoToEdit.thumbnail,
                    homeworkTitle: (videoToEdit as any).homeworkTitle || '',
                    homeworkDescription: (videoToEdit as any).homeworkDescription || '',
                });
                setThumbnailPreview(videoToEdit.thumbnail);
                if (videoToEdit.thumbnail.startsWith('http')) {
                    setThumbnailMode('url');
                }
            }
        }
    }, [editId, preSelectedCategory]);

    const validateVideoFile = (file: File): boolean => {
        setVideoError('');

        // Check file type
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
            setVideoError('Faqat MP4 formatdagi videolar qabul qilinadi');
            toast({
                title: 'Xatolik',
                description: 'Faqat MP4 formatdagi videolar qabul qilinadi',
                variant: 'destructive'
            });
            return false;
        }

        // Check file size
        if (file.size > MAX_VIDEO_SIZE) {
            const sizeMB = Math.round(file.size / (1024 * 1024));
            setVideoError(`Video hajmi ${sizeMB}MB. Maksimal hajm 150MB`);
            toast({
                title: 'Xatolik',
                description: `Video hajmi juda katta (${sizeMB}MB). Maksimal hajm 150MB`,
                variant: 'destructive'
            });
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

            // Get video duration
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
        if (file) {
            if (file.type.startsWith('image/')) {
                setThumbnailFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setThumbnailPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                toast({title: 'Xatolik', description: 'Faqat rasm fayl yuklang', variant: 'destructive'});
            }
        }
    };

    const handleThumbnailUrlChange = (url: string) => {
        setFormData(prev => ({...prev, thumbnail: url}));
        setThumbnailPreview(url);
    };

    const handleHomeworkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setHomeworkFile(file);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.categoryId) {
            toast({title: 'Xatolik', description: 'Sarlavha va kategoriyani to\'ldiring', variant: 'destructive'});
            return;
        }

        if (!videoFile && !formData.videoUrl) {
            toast({title: 'Xatolik', description: 'Video yuklang yoki video URL kiriting', variant: 'destructive'});
            return;
        }

        if (videoFile && !validateVideoFile(videoFile)) {
            return;
        }

        if (!thumbnailFile && !formData.thumbnail) {
            toast({title: 'Xatolik', description: 'Thumbnail yuklang yoki URL kiriting', variant: 'destructive'});
            return;
        }

        setIsLoading(true);

        try {
            // Try to save via API
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('category', formData.categoryId);
            formDataToSend.append('duration', formData.duration);

            if (videoFile) {
                formDataToSend.append('video_file', videoFile);
            } else {
                formDataToSend.append('video_url', formData.videoUrl);
            }

            if (thumbnailFile) {
                formDataToSend.append('thumbnail', thumbnailFile);
            } else {
                formDataToSend.append('thumbnail_url', formData.thumbnail);
            }

            if (editId) {
                await videosApi.update(editId, formDataToSend);
                toast({title: 'Muvaffaqiyat', description: 'Video yangilandi'});
            } else {
                await videosApi.create(formDataToSend);
                toast({title: 'Muvaffaqiyat', description: 'Video qo\'shildi'});
            }

            navigate('/admin/videos');
        } catch (error) {
            // Fallback to localStorage
            let videoData = formData.videoUrl;
            let thumbnailData = formData.thumbnail || thumbnailPreview;
            let homeworkData = '';

            // Get existing videos from localStorage or use demo data
            const existingVideos = JSON.parse(localStorage.getItem('abdiyev_videos') || JSON.stringify(demoVideos));

            if (editId) {
                // Update existing video
                const updatedVideos = existingVideos.map((v: Video) =>
                    v.id === editId
                        ? {
                            ...v,
                            ...formData,
                            videoUrl: videoData,
                            thumbnail: thumbnailData,
                            homeworkFile: homeworkData || (v as any).homeworkFile,
                        }
                        : v
                );
                localStorage.setItem('abdiyev_videos', JSON.stringify(updatedVideos));
                toast({title: 'Muvaffaqiyat', description: 'Video yangilandi'});
            } else {
                // Add new video
                const categoryVideos = existingVideos.filter((v: Video) => v.categoryId === formData.categoryId);

                const newVideo: Video = {
                    id: `vid-${Date.now()}`,
                    ...formData,
                    videoUrl: videoData,
                    thumbnail: thumbnailData,
                    order: categoryVideos.length + 1,
                    createdAt: new Date().toISOString().split('T')[0],
                    viewCount: 0,
                    homeworkFile: homeworkData,
                } as any;

                existingVideos.push(newVideo);
                localStorage.setItem('abdiyev_videos', JSON.stringify(existingVideos));
                toast({title: 'Muvaffaqiyat', description: 'Video qo\'shildi'});
            }

            navigate('/admin/videos');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/admin/videos')}
                    >
                        <ArrowLeft className="h-4 w-4"/>
                    </Button>
                    <div className="animate-fade-in">
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                            {editId ? 'Videoni tahrirlash' : 'Yangi video qo\'shish'}
                        </h1>
                        <p className="text-muted-foreground">
                            Video dars ma'lumotlarini kiriting
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
                    {/* Basic Info */}
                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Asosiy ma'lumotlar</h2>

                        <div className="space-y-2">
                            <Label htmlFor="title">Sarlavha <span className='text-red-500'>*</span></Label>
                            <Input
                                id="title"
                                placeholder="Video sarlavhasi"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Kategoriya <span className='text-red-500'>*</span></Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData(prev => ({...prev, categoryId: value}))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Kategoriyani tanlang"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(categories) && categories.length > 0 ? (
                                        categories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.icon} {cat.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem disabled value="no-categories">
                                            Kurslar mavjud emas
                                        </SelectItem>
                                    )}

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

                        {/* Video Requirements Notice */}
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                            <p className="text-sm text-warning flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0"/>
                                <span>Faqat MP4 formatda, maksimal hajmi 150MB</span>
                            </p>
                        </div>

                        <Tabs defaultValue="file" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="file">Fayl yuklash</TabsTrigger>
                                <TabsTrigger value="url">URL (YouTube, etc)</TabsTrigger>
                            </TabsList>

                            <TabsContent value="file" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Video fayl * (faqat MP4, max 150MB)</Label>
                                    <div className="flex flex-col gap-3">
                                        <input
                                            ref={videoInputRef}
                                            type="file"
                                            accept="video/mp4"
                                            className="hidden"
                                            onChange={handleVideoFileChange}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={`w-full ${videoError ? 'border-destructive' : ''}`}
                                            onClick={() => videoInputRef.current?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4"/>
                                            {videoFile ? videoFile.name : 'Video tanlang (MP4, max 150MB)'}
                                        </Button>
                                        {videoError && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertTriangle className="h-4 w-4"/>
                                                {videoError}
                                            </p>
                                        )}
                                        {videoFile && !videoError && (
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                                <div>
                                                    <span
                                                        className="text-sm text-muted-foreground">{videoFile.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                            ({Math.round(videoFile.size / (1024 * 1024))}MB)
                          </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setVideoFile(null);
                                                        setVideoError('');
                                                    }}
                                                >
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="videoUrl">Video URL (embed) *</Label>
                                    <Input
                                        id="videoUrl"
                                        placeholder="https://www.youtube.com/embed/..."
                                        value={formData.videoUrl}
                                        onChange={(e) => setFormData(prev => ({...prev, videoUrl: e.target.value}))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        YouTube uchun: Videoning embed URL manzilini kiriting
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Davomiyligi</Label>
                            <Input
                                id="duration"
                                placeholder="15:30"
                                value={formData.duration}
                                onChange={(e) => setFormData(prev => ({...prev, duration: e.target.value}))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Video fayl yuklanganda avtomatik to'ldiriladi
                            </p>
                        </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Thumbnail (rasm)</h2>

                        <Tabs value={thumbnailMode} onValueChange={(v) => setThumbnailMode(v as 'upload' | 'url')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Fayl yuklash</TabsTrigger>
                                <TabsTrigger value="url">URL dan</TabsTrigger>
                            </TabsList>

                            <TabsContent value="upload" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Rasm fayl *</Label>
                                    <div className="flex flex-col gap-3">
                                        <input
                                            ref={thumbnailInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleThumbnailFileChange}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => thumbnailInputRef.current?.click()}
                                        >
                                            <ImageIcon className="mr-2 h-4 w-4"/>
                                            {thumbnailFile ? thumbnailFile.name : 'Rasm tanlang'}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="thumbnail">Rasm URL *</Label>
                                    <Input
                                        id="thumbnail"
                                        placeholder="https://..."
                                        value={formData.thumbnail}
                                        onChange={(e) => handleThumbnailUrlChange(e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        {thumbnailPreview && (
                            <div className="mt-4">
                                <Label>Ko'rinish</Label>
                                <div className="mt-2 relative rounded-lg overflow-hidden max-w-sm">
                                    <img
                                        src={thumbnailPreview}
                                        alt="Thumbnail preview"
                                        className="w-full aspect-video object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                                        onClick={() => {
                                            setThumbnailFile(null);
                                            setThumbnailPreview('');
                                            setFormData(prev => ({...prev, thumbnail: ''}));
                                        }}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Homework (Optional) */}
                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">Uyga vazifa (ixtiyoriy)</h2>
                            <span className="text-xs text-muted-foreground">Majburiy emas</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="homeworkTitle">Vazifa sarlavhasi</Label>
                            <Input
                                id="homeworkTitle"
                                placeholder="Masalan: 1-mashq topshirig'i"
                                value={formData.homeworkTitle}
                                onChange={(e) => setFormData(prev => ({...prev, homeworkTitle: e.target.value}))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="homeworkDescription">Vazifa tavsifi</Label>
                            <Textarea
                                id="homeworkDescription"
                                placeholder="O'quvchi nimani bajarishi kerakligini yozing"
                                value={formData.homeworkDescription}
                                onChange={(e) => setFormData(prev => ({...prev, homeworkDescription: e.target.value}))}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Vazifa fayli (masalan: PDF, Word)</Label>
                            <div className="flex flex-col gap-3">
                                <input
                                    ref={homeworkInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={handleHomeworkFileChange}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => homeworkInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4"/>
                                    {homeworkFile ? homeworkFile.name : 'Fayl tanlang'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => navigate('/admin/videos')}>
                            Bekor qilish
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="gradient-primary text-primary-foreground"
                            disabled={isLoading || !!videoError}
                        >
                            {isLoading ? 'Saqlanmoqda...' : editId ? 'Yangilash' : 'Saqlash'}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
