import {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    ArrowLeft,
    Clock,
    Eye,
    Calendar,
    FolderOpen,
    ClipboardList,
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
    Search,
    ChevronRight,
    Users,
    BarChart3
} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {videosApi, tasksApi, submissionsApi} from '@/services/api';
import {api} from "@/lib/api.ts";
import {cn, formatDate} from "@/lib/utils.ts";
import VideoPlayer from "@/components/VideoPlayes.tsx";

interface Task {
    id: number;
    title: string;
    description: string;
    task_type: string;
    questions: any[];
    allow_resubmission: boolean;
}

interface Submission {
    id: number;
    user: number;
    user_name: string;
    user_full_name: string;
    task: number;
    task_title: string;
    task_type: string;
    score: number;
    total: number;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
}

export default function AdminVideoDetail() {
    const {videoId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [video, setVideo] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const getUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res);
        } catch (err) {
            console.error(err);
        }
    };

    const loadData = async () => {
        try {
            const [videoRes, tasksRes, subsRes] = await Promise.all([
                api.get(`/videos/${videoId}`),
                tasksApi.getByVideo(videoId!),
                submissionsApi.getByVideo(videoId!)
            ]);
            
            setVideo(videoRes);
            setTasks(Array.isArray(tasksRes) ? tasksRes : []);
            setSubmissions(Array.isArray(subsRes) ? subsRes : []);
        } catch (err) {
            console.error(err);
            toast({
                title: "Xatolik",
                description: "Ma'lumotlarni yuklashda xatolik",
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        getUser();
    }, [videoId]);

    // Filter submissions
    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch = 
            sub.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.user_full_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filterStatus === 'all') return matchesSearch;
        return matchesSearch && sub.status === filterStatus;
    });

    // Statistics
    const totalSubmissions = submissions.length;
    const approvedCount = submissions.filter(s => s.status === 'approved').length;
    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

    const handleDelete = async () => {
        try {
            await videosApi.delete(videoId!);
            toast({title: 'O\'chirildi', description: 'Video o\'chirildi'});
            navigate('/admin/videos');
        } catch (error) {
            toast({title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive'});
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate('/admin/videos')} className="-ml-2 hover:bg-card">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Orqaga
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/admin/videos/${videoId}/edit`)}
                        className='hover:bg-card'
                    >
                        <Pencil className="mr-2 h-4 w-4"/>
                        Tahrirlash
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-destructive hover:text-white hover:bg-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4"/>
                        O'chirish
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
                    <TabsTrigger value="info">Ma'lumot</TabsTrigger>
                    <TabsTrigger value="stats">Statistika</TabsTrigger>
                </TabsList>

                {/* Video Info Tab */}
                <TabsContent value="info" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Video + Info */}
                        <div className="lg:col-span-2 space-y-6 animate-fade-in">

                            <div className="relative w-full rounded-xl bg-black overflow-hidden">
                                <VideoPlayer 
                                    videoUrl={video.video_url}
                                    userId={`${user?.watermark_id} • ${user?.username}`}
                                />
                            </div>

                            {/* VIDEO INFO */}
                            <div>
                                <h1 className="text-2xl font-bold text-foreground mb-4">
                                    {video.title}
                                </h1>

                                <p className="text-muted-foreground mb-6">
                                    {video.description}
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Clock className="h-4 w-4"/>
                                            <span className="text-sm">Davomiylik</span>
                                        </div>
                                        <p className="font-semibold text-foreground">
                                            {video.duration}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Eye className="h-4 w-4"/>
                                            <span className="text-sm">Ko'rishlar</span>
                                        </div>
                                        <p className="font-semibold text-foreground">
                                            {video.view_count}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Calendar className="h-4 w-4"/>
                                            <span className="text-sm">Qo'shilgan</span>
                                        </div>
                                        <p className="font-semibold text-foreground">
                                            {formatDate(video.created_at)}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <FolderOpen className="h-4 w-4"/>
                                            <span className="text-sm">Kurs</span>
                                        </div>
                                        <button
                                            className="font-semibold text-primary hover:text-success transition"
                                            onClick={() => navigate(`/admin/categories/${video.category}`)}
                                        >
                                            {video.category_name}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR */}
                        <div className="space-y-6 animate-fade-in" style={{animationDelay: "0.1s"}}>

                            {/* TASKS INFO */}
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-primary"/>
                                    Vazifalar
                                </h3>

                                {tasks.length > 0 ? (
                                    <div className="space-y-3">
                                        {tasks.map((task) => (
                                            <div 
                                                key={task.id}
                                                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/admin/tasks/${task.id}`)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm">{task.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {task.task_type === 'test' ? `${task.questions?.length || 0} ta savol` :
                                                             task.task_type === 'file' ? 'Fayl yuklash' : 'Matn'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            className="w-full mt-2"
                                            onClick={() => navigate(`/admin/tasks/${tasks[0].id}/stats`)}
                                        >
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            Statistikani ko'rish
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted-foreground mb-3">
                                            Bu videoga vazifa biriktirilmagan
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate("/admin/tasks")}
                                        >
                                            Vazifa qo'shish
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* THUMBNAIL */}
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="font-semibold text-card-foreground mb-4">
                                    Thumbnail
                                </h3>
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full rounded-lg object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>


                {/* Statistics Tab */}
                <TabsContent value="stats" className="space-y-6">
                    <div className="animate-fade-in">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 rounded-xl border border-border bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Jami topshirgan</p>
                                        <p className="text-2xl font-bold text-foreground">{totalSubmissions}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tasdiqlangan</p>
                                        <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Kutilmoqda</p>
                                        <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                                        <XCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Qaytarilgan</p>
                                        <p className="text-2xl font-bold text-foreground">{rejectedCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="O'quvchi ismi bo'yicha qidirish..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full sm:w-[220px]">
                                    <SelectValue placeholder="Holati"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Barchasi</SelectItem>
                                    <SelectItem value="approved">Tasdiqlangan</SelectItem>
                                    <SelectItem value="pending">Kutilmoqda</SelectItem>
                                    <SelectItem value="rejected">Qaytarilgan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submissions List */}
                        <div className="space-y-3">
                            {filteredSubmissions.length > 0 ? (
                                filteredSubmissions.map((sub) => (
                                    <div 
                                        key={sub.id}
                                        className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/admin/submissions/${sub.id}`)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                                    {sub.user_full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{sub.user_full_name}</p>
                                                    <p className="text-xs text-muted-foreground">@{sub.user_name} • {sub.task_title}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                {sub.total > 0 && (
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            "font-bold",
                                                            sub.score / sub.total >= 0.7 ? "text-green-600" :
                                                            sub.score / sub.total >= 0.5 ? "text-warning" : "text-destructive"
                                                        )}>
                                                            {sub.score}/{sub.total}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                <Badge className={cn(
                                                    sub.status === 'approved' && "bg-green-500/10 text-green-600 border-green-500/30",
                                                    sub.status === 'pending' && "bg-warning/10 text-warning border-warning/30",
                                                    sub.status === 'rejected' && "bg-destructive/10 text-destructive border-destructive/30"
                                                )}>
                                                    {sub.status === 'approved' && 'Tasdiqlangan'}
                                                    {sub.status === 'pending' && 'Kutilmoqda'}
                                                    {sub.status === 'rejected' && 'Qaytarilgan'}
                                                </Badge>
                                                
                                                <span className="text-sm text-muted-foreground hidden sm:block">
                                                    {formatDate(sub.submitted_at)}
                                                </span>
                                                
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 rounded-xl border border-border bg-card">
                                    <p className="text-muted-foreground">Hozircha topshiriqlar yo'q</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Videoni o'chirish"
                description="Rostdan ham bu videoni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </DashboardLayout>
    );
}