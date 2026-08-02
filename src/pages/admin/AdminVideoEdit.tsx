import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Image as ImageIcon, Save, Upload, X} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {useToast} from '@/hooks/use-toast';
import {categoriesApi, modulesApi, videosApi} from '@/services/api';

const MAX_VIDEO_SIZE = 150 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ['video/mp4'];

const toEmbedUrl = (url: string): string => {
    if (!url) return '';
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com')) {
            if (u.pathname.startsWith('/embed/')) return url;
            const v = u.searchParams.get('v');
            if (v) return `https://www.youtube.com/embed/${v}`;
        }
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.split('/').filter(Boolean)[0];
            if (id) return `https://www.youtube.com/embed/${id}`;
        }
        if (u.hostname.includes('vimeo.com')) {
            const id = u.pathname.split('/').filter(Boolean)[0];
            if (id) return `https://player.vimeo.com/video/${id}`;
        }
    } catch { /* ignore */
    }
    return url;
};

const getApiErrorMessage = (error: any, fallback: string) => {
    const data = error?.response?.data;
    if (typeof data === 'string') return data;
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;
    return error?.message || fallback;
};

const isExternalVideoUrl = (url: string) => {
    if (!url) return false;
    return /youtube\.com|youtu\.be|vimeo\.com/i.test(url) || !url.includes('/media/videos/');
};

export default function AdminVideoEdit() {
    const {videoId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();
    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [videoMode, setVideoMode] = useState<'file' | 'url'>('file');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoFilePreview, setVideoFilePreview] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [videoError, setVideoError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        module: '',
        duration: '',
        videoUrl: '',
        thumbnail: '',
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [videoRes, categoriesRes] = await Promise.all([
                    videosApi.getById(videoId!),
                    categoriesApi.getAll(),
                ]);
                console.log("video res", videoRes)
                const categoriesData = categoriesRes?.results || categoriesRes || [];
                const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
                const currentCategory = categoriesList.find((cat: any) => String(cat.id) === String(videoRes.category));
                setCategories(categoriesList);
                setSelectedCategory(currentCategory || null);
                setVideoMode(isExternalVideoUrl(videoRes.video_url || '') ? 'url' : 'file');
                setThumbnailPreview(videoRes.thumbnail || '');
                setFormData({
                    title: videoRes.title || '',
                    description: videoRes.description || '',
                    category: String(videoRes.category || ''),
                    module: videoRes.module ? String(videoRes.module) : '',
                    duration: videoRes.duration || '',
                    videoUrl: videoRes.video_url || '',
                    thumbnail: videoRes.thumbnail || '',
                });
            } catch (error: any) {
                toast({
                    title: 'Xatolik',
                    description: getApiErrorMessage(error, 'Video maʼlumotlari yuklanmadi'),
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [videoId, toast]);

    useEffect(() => {
        if (formData.category && selectedCategory?.is_modular) {
            modulesApi.getByCategory(formData.category)
                .then(data => setModules(data?.results || data || []))
                .catch(() => setModules([]));
        } else {
            setModules([]);
        }
    }, [formData.category, selectedCategory]);

    const handleCategoryChange = (categoryId: string) => {
        const category = categories.find(cat => String(cat.id) === categoryId);
        setSelectedCategory(category || null);
        setFormData(prev => ({...prev, category: categoryId, module: ''}));
    };

    const validateVideoFile = (file: File) => {
        setVideoError('');
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
            setVideoError('Faqat MP4 formatdagi videolar qabul qilinadi');
            return false;
        }
        if (file.size > MAX_VIDEO_SIZE) {
            setVideoError(`Video hajmi ${Math.round(file.size / (1024 * 1024))}MB. Maksimal hajm 150MB`);
            return false;
        }
        return true;
    };

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !validateVideoFile(file)) return;
        const blobUrl = URL.createObjectURL(file);
        setVideoFile(file);
        setVideoFilePreview(blobUrl);

        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            const minutes = Math.floor(video.duration / 60);
            const seconds = Math.floor(video.duration % 60);
            setFormData(prev => ({
                ...prev,
                duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
                videoUrl: ''
            }));
        };
        video.src = blobUrl;
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        setThumbnailFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setThumbnailPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.category) {
            toast({title: 'Xatolik', description: 'Sarlavha va kursni toʼldiring', variant: 'destructive'});
            return;
        }
        if (selectedCategory?.is_modular && !formData.module) {
            toast({title: 'Xatolik', description: 'Modulli kurs uchun modulni tanlang', variant: 'destructive'});
            return;
        }
        if (videoMode === 'url' && !formData.videoUrl.trim()) {
            toast({title: 'Xatolik', description: 'Video havolasini kiriting', variant: 'destructive'});
            return;
        }

        setSaving(true);
        try {
            const dataToSend = new FormData();
            dataToSend.append('title', formData.title);
            dataToSend.append('description', formData.description || '');
            dataToSend.append('category', formData.category);
            dataToSend.append('duration', formData.duration || '0:00');
            if (formData.module) dataToSend.append('module', formData.module);
            if (videoMode === 'file' && videoFile) dataToSend.append('video_file', videoFile);
            if (videoMode === 'url') dataToSend.append('video_url', formData.videoUrl.trim());
            if (thumbnailFile) dataToSend.append('thumbnail', thumbnailFile);
            else if (formData.thumbnail) dataToSend.append('thumbnail_url', formData.thumbnail);

            await videosApi.update(videoId!, dataToSend);
            toast({title: 'Muvaffaqiyatli', description: 'Dars muvaffaqiyatli tahrirlandi'});
            navigate(`/admin/videos/${videoId}`);
        } catch (error: any) {
            toast({
                title: 'Xatolik',
                description: getApiErrorMessage(error, 'Video tahrirlashda xatolik'),
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
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

    return (
        <DashboardLayout>
            <Button variant="ghost" onClick={() => navigate(`/admin/videos/${videoId}`)} className="mb-6 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Orqaga
            </Button>

            <div className="w-full">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Videoni tahrirlash</h1>
                    <p className="text-muted-foreground">Video dars ma'lumotlarini yangilang</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Asosiy ma'lumotlar</h2>
                        <div className="space-y-2">
                            <Label htmlFor="title">Sarlavha *</Label>
                            <Input id="title" value={formData.title}
                                   onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Tavsif</Label>
                            <Textarea id="description" value={formData.description}
                                      onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                                      rows={4}/>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 w-full">
                                <Label>Kurs *</Label>
                                <Select value={formData.category} onValueChange={handleCategoryChange}>
                                    <SelectTrigger><SelectValue placeholder="Kursni tanlang"/></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => <SelectItem key={cat.id}
                                                                           value={String(cat.id)}>{cat.icon} {cat.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedCategory?.is_modular && (
                                <div className="space-y-2">
                                    <Label>Modul *</Label>
                                    <Select value={formData.module}
                                            onValueChange={(value) => setFormData(prev => ({...prev, module: value}))}>
                                        <SelectTrigger><SelectValue placeholder="Modulni tanlang"/></SelectTrigger>
                                        <SelectContent>
                                            {modules.map(module => <SelectItem key={module.id}
                                                                               value={String(module.id)}>{module.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Video</h2>
                        <div className="space-y-2">
                            <Label>Video manbai</Label>
                            <Select value={videoMode} onValueChange={(value) => {
                                const mode = value as 'file' | 'url';
                                setVideoMode(mode);
                                setVideoError('');
                                if (mode === 'url') setVideoFile(null);
                                if (mode === 'file') setFormData(prev => ({...prev, videoUrl: ''}));
                            }}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="file">Video fayl yuklash</SelectItem>
                                    <SelectItem value="url">Video havola (YouTube, Vimeo, ...)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {videoMode === 'file' ? (
                            <div className="space-y-3">
                                {/* Hozirgi (saqlangan) video - agar yangi fayl tanlanmagan bo'lsa */}
                                {!videoFile && formData.videoUrl && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Hozirgi video:</p>
                                        <video
                                            src={formData.videoUrl}
                                            controls
                                            className="w-full rounded-lg bg-black aspect-video max-h-48"
                                        />
                                    </div>
                                )}

                                <input ref={videoInputRef} type="file" accept="video/mp4" className="hidden"
                                       onChange={handleVideoFileChange}/>
                                <Button type="button" variant="outline"
                                        className={`w-full ${videoError ? 'border-destructive' : ''}`}
                                        onClick={() => videoInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4"/>
                                    {videoFile ? videoFile.name : (formData.videoUrl ? 'Yangi video bilan almashtirish' : 'Yangi MP4 fayl tanlang')}
                                </Button>
                                {videoError && <p className="text-sm text-destructive">{videoError}</p>}

                                {videoFilePreview && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Yangi tanlangan video:</p>
                                        <video src={videoFilePreview} controls
                                               className="w-full rounded-lg bg-black aspect-video max-h-48"/>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Input placeholder="https://www.youtube.com/watch?v=..." value={formData.videoUrl}
                                       onChange={(e) => setFormData(prev => ({...prev, videoUrl: e.target.value}))}/>
                                {formData.videoUrl && (
                                    <div
                                        className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
                                        <iframe src={toEmbedUrl(formData.videoUrl)} title="Video preview"
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                                allowFullScreen/>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="duration">Davomiylik</Label>
                            <Input id="duration" value={formData.duration}
                                   onChange={(e) => setFormData(prev => ({...prev, duration: e.target.value}))}
                                   placeholder="15:30"/>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Thumbnail</h2>
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                            <Input placeholder="Rasm URL" value={formData.thumbnail} onChange={(e) => {
                                setFormData(prev => ({...prev, thumbnail: e.target.value}));
                                setThumbnailPreview(e.target.value);
                            }}/>
                            <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden"
                                   onChange={handleThumbnailFileChange}/>
                            <Button type="button" variant="outline" onClick={() => thumbnailInputRef.current?.click()}>
                                <ImageIcon
                                    className="mr-2 h-4 w-4"/> {thumbnailFile ? thumbnailFile.name : 'Rasm yuklash'}
                            </Button>
                        </div>
                        {thumbnailPreview && (
                            <div className="relative max-w-sm rounded-lg overflow-hidden">
                                <img src={thumbnailPreview} alt="Thumbnail preview"
                                     className="w-full aspect-video object-cover"/>
                                <Button type="button" variant="ghost" size="icon"
                                        className="absolute top-2 right-2 bg-background/80" onClick={() => {
                                    setThumbnailFile(null);
                                    setThumbnailPreview('');
                                    setFormData(prev => ({...prev, thumbnail: ''}));
                                }}>
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={saving || !!videoError}
                                className="gradient-primary text-primary-foreground">
                            <Save className="mr-2 h-4 w-4"/>
                            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => navigate(`/admin/videos/${videoId}`)}>Bekor
                            qilish</Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}