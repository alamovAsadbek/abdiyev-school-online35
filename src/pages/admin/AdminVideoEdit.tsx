import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft, Save} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {Category, demoCategories, getVideoById, Video} from '@/data/demoData';
import {api} from "@/lib/api.ts";

export default function AdminVideoEdit() {
    const {videoId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();
    const [video, setVideo] = useState<any>(null);
    const [category, setCategory] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        duration: '',
        videoUrl: '',
        thumbnail: '',
    });

    const getVideoById = async (videoID = videoId) => {
        try {
            api.get(`/videos/${videoId}`).then((response) => {
                console.log(response);
                setVideo(response)
            }).catch((error) => {
                console.log(error);
                toast({
                    title: 'Xatolik',
                    description: error.message,
                })
            })
        } catch (e) {
            console.log(e)
            toast({
                title: 'Xatolik',
                description: e.message,
            })
        }
    }

    const getCategory = async () => {
        try {
            api.get(`/categories`).then((response) => {
                setCategory(response?.results);
                console.log(response?.results)
            }).catch((error) => {
                console.log(error);
                toast({
                    title: 'Xatolik',
                    description: error.message,
                })
            })
        } catch (e) {
            console.log(e)
            toast({
                title: 'Xatolik',
                description: e.message,
            })
        }
    }
    useEffect(() => {
        getCategory();
        getVideoById(videoId);
    }, [videoId]);

    useEffect(() => {
        if (video) {
            setFormData({
                title: video.title,
                description: video.description,
                categoryId: video.category,
                duration: video.duration,
                videoUrl: video.video_url,
                thumbnail: video.thumbnail,
            });
        }
    }, [video]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: 'Saqlandi',
            description: 'Video muvaffaqiyatli tahrirlandi',
        });
        navigate(`/admin/videos/${videoId}`);
    };

    if (!video) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground mb-4">Video topilmadi</p>
                    <Button onClick={() => navigate('/admin/videos')}>Orqaga qaytish</Button>
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
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Videoni tahrirlash
                    </h1>
                    <p className="text-muted-foreground">
                        Video ma'lumotlarini yangilang
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
                    <div className="space-y-2">
                        <Label htmlFor="title">Sarlavha</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Tavsif</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Kurs</Label>
                        <Select
                            value={formData.categoryId}
                            onValueChange={(value) => setFormData({...formData, categoryId: value})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kategoriyani tanlang"/>
                            </SelectTrigger>
                            <SelectContent>
                                {category.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Davomiylik (mm:ss)</Label>
                        <Input
                            id="duration"
                            value={formData.duration}
                            onChange={(e) => setFormData({...formData, duration: e.target.value})}
                            placeholder="15:30"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="videoUrl">Video URL (YouTube embed)</Label>
                        <Input
                            id="videoUrl"
                            value={formData.videoUrl}
                            onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                            placeholder="https://www.youtube.com/embed/..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="thumbnail">Thumbnail URL</Label>
                        <Input
                            id="thumbnail"
                            value={formData.thumbnail}
                            onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                            placeholder="https://..."
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" className="gradient-primary text-primary-foreground">
                            <Save className="mr-2 h-4 w-4"/>
                            Saqlash
                        </Button>
                        <Button type="button" variant="outline" onClick={() => navigate(`/admin/videos/${videoId}`)}>
                            Bekor qilish
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
