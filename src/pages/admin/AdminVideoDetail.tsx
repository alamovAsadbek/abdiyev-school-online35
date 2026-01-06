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
    Search
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
import {
    demoVideos,
    demoTasks,
    demoUsers,
    getCategoryById,
    getVideoById,
    initialStudentProgress,
} from '@/data/demoData';
import {api} from "@/lib/api.ts";
import {formatDate} from "@/lib/utils.ts";

interface StudentStat {
    id: string;
    name: string;
    email: string;
    hasViewed: boolean;
    hasCompletedTask: boolean;
    taskScore?: { score: number; total: number };
}

export default function AdminVideoDetail() {
    const {videoId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [video, setVideo] = useState(null)
    const category = video ? getCategoryById(video.categoryId) : null;
    const task = demoTasks.find(t => t.videoId === videoId);

    useEffect(() => {
        try {
            api.get(`/videos/${videoId}`).then((res) => {
                console.log(res)
                setVideo(res);
            }).catch((err) => {
                console.log(err);
            })
        } catch (e) {
            console.log(e)
        }
    }, [videoId]);

    // Generate student statistics
    const studentStats: StudentStat[] = demoUsers
        .filter(u => u.role === 'student')
        .map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            hasViewed: initialStudentProgress.completedVideos.includes(videoId || ''),
            hasCompletedTask: task ? initialStudentProgress.completedTasks.includes(task.id) : false,
            taskScore: task ? initialStudentProgress.taskScores.find(s => s.taskId === task.id) : undefined,
        }));

    // Filter students
    const filteredStats = studentStats.filter(stat => {
        const matchesSearch = stat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stat.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterStatus === 'viewed') return matchesSearch && stat.hasViewed;
        if (filterStatus === 'not-viewed') return matchesSearch && !stat.hasViewed;
        if (filterStatus === 'completed-task') return matchesSearch && stat.hasCompletedTask;
        if (filterStatus === 'not-completed-task') return matchesSearch && !stat.hasCompletedTask;

        return matchesSearch;
    });

    const handleDelete = () => {
        toast({title: 'O\'chirildi', description: 'Video o\'chirildi'});
        navigate('/admin/videos');
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
                        {/* Video Preview */}
                        <div className="lg:col-span-2 space-y-6 animate-fade-in">
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                                <iframe
                                    src={video.videoUrl}
                                    title={video.title}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-foreground mb-4">{video.title}</h1>
                                <p className="text-muted-foreground mb-6">{video.description}</p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Clock className="h-4 w-4"/>
                                            <span className="text-sm">Davomiylik</span>
                                        </div>
                                        <p className="font-semibold text-foreground">{video.duration}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Eye className="h-4 w-4"/>
                                            <span className="text-sm">Ko'rishlar</span>
                                        </div>
                                        <p className="font-semibold text-foreground">{video.viewCount}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Calendar className="h-4 w-4"/>
                                            <span className="text-sm">Qo'shilgan</span>
                                        </div>
                                        <p className="font-semibold text-foreground">{formatDate(video.created_at)}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <FolderOpen className="h-4 w-4"/>
                                            <span className="text-sm">Kurs</span>
                                        </div>
                                        <a className="font-semibold text-primary cursor-pointer hover:text-success"
                                           onClick={() => {
                                               navigate(`/admin/categories/${video.category}`)
                                           }}>{video?.category_name}</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
                            {/* Task Info */}
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-primary"/>
                                    Vazifa
                                </h3>
                                {task ? (
                                    <div>
                                        <p className="font-medium mb-2">{task.title}</p>
                                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {task.questions.length} ta savol
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="w-full mt-4"
                                            onClick={() => navigate(`/admin/tasks`)}
                                        >
                                            Vazifani ko'rish
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted-foreground mb-3">Bu videoga vazifa biriktirilmagan</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate('/admin/tasks')}
                                        >
                                            Vazifa qo'shish
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Preview */}
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="font-semibold text-card-foreground mb-4">Thumbnail</h3>
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full rounded-lg"
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
                                <p className="text-sm text-muted-foreground mb-1">Jami o'quvchilar</p>
                                <p className="text-2xl font-bold text-foreground">{studentStats.length}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-card">
                                <p className="text-sm text-muted-foreground mb-1">Ko'rganlar</p>
                                <p className="text-2xl font-bold text-primary">
                                    {studentStats.filter(s => s.hasViewed).length}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-card">
                                <p className="text-sm text-muted-foreground mb-1">Vazifa bajarganlar</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {studentStats.filter(s => s.hasCompletedTask).length}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-card">
                                <p className="text-sm text-muted-foreground mb-1">Vazifa bajarmaganlar</p>
                                <p className="text-2xl font-bold text-destructive">
                                    {studentStats.filter(s => !s.hasCompletedTask).length}
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="flex-1 relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="O'quvchi ismi yoki email bo'yicha qidirish..."
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
                                    <SelectItem value="viewed">Ko'rganlar</SelectItem>
                                    <SelectItem value="not-viewed">Ko'rmaganlar</SelectItem>
                                    <SelectItem value="completed-task">Vazifa bajarganlar</SelectItem>
                                    <SelectItem value="not-completed-task">Vazifa bajarmaganlar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Students List */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">O'quvchi</th>
                                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Ko'rgan</th>
                                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Vazifa</th>
                                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Ball</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredStats.length > 0 ? (
                                        filteredStats.map((stat) => (
                                            <tr key={stat.id}
                                                className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium text-foreground">{stat.name}</p>
                                                        <p className="text-xs text-muted-foreground">{stat.email}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {stat.hasViewed ? (
                                                        <Badge variant="default"
                                                               className="bg-primary/10 text-primary hover:bg-primary/20">
                                                            <CheckCircle2 className="h-3 w-3 mr-1"/>
                                                            Ha
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            <XCircle className="h-3 w-3 mr-1"/>
                                                            Yo'q
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {stat.hasCompletedTask ? (
                                                        <Badge variant="default"
                                                               className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                                            <CheckCircle2 className="h-3 w-3 mr-1"/>
                                                            Bajarilgan
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            <XCircle className="h-3 w-3 mr-1"/>
                                                            Bajarilmagan
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {stat.taskScore ? (
                                                        <span className="font-medium">
                                {stat.taskScore.score}/{stat.taskScore.total}
                              </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                O'quvchilar topilmadi
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
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
