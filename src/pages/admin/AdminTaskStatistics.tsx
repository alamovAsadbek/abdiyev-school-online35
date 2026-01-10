import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckCircle2, XCircle, Clock, Search, 
  Filter, Eye, FileText, MessageSquare, ChevronRight
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tasksApi, submissionsApi } from '@/services/api';
import { cn, formatDate } from '@/lib/utils';

interface Submission {
  id: number;
  user: number;
  user_name: string;
  user_full_name: string;
  task: number;
  task_title: string;
  task_type: string;
  video_title: string;
  file?: string;
  text_content?: string;
  answers: Record<string, number>;
  score: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  reviewed_at?: string;
  submitted_at: string;
}

interface TaskWithQuestions {
  id: number;
  title: string;
  description: string;
  task_type: string;
  questions: {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
  }[];
}

export default function AdminTaskStatistics() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [task, setTask] = useState<TaskWithQuestions | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    try {
      const [taskData, submissionsData] = await Promise.all([
        tasksApi.getById(taskId!),
        submissionsApi.getByTask(taskId!)
      ]);
      setTask(taskData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Xatolik', description: 'Ma\'lumotlar yuklanmadi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

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
  
  // For tests: average score
  const testSubmissions = submissions.filter(s => s.total > 0);
  const avgScore = testSubmissions.length > 0 
    ? (testSubmissions.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / testSubmissions.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          {task.title} - Statistika
        </h1>
        <p className="text-muted-foreground">
          Vazifa turi: {task.task_type === 'test' ? 'Test' : task.task_type === 'file' ? 'Fayl yuklash' : 'Matn'}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
        
        {task.task_type === 'test' ? (
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">O'rtacha ball</p>
                <p className="text-2xl font-bold text-foreground">{avgScore}%</p>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="O'quvchi ismi bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Holati" />
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
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-card">
            <p className="text-muted-foreground">Hozircha topshiriqlar yo'q</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <div 
              key={submission.id}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/submissions/${submission.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {submission.user_full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{submission.user_full_name}</p>
                    <p className="text-sm text-muted-foreground">@{submission.user_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {task.task_type === 'test' && (
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        submission.score / submission.total >= 0.7 ? "text-green-600" :
                        submission.score / submission.total >= 0.5 ? "text-warning" : "text-destructive"
                      )}>
                        {submission.score}/{submission.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((submission.score / submission.total) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                  
                  <Badge className={cn(
                    submission.status === 'approved' && "bg-green-500/10 text-green-600 border-green-500/30",
                    submission.status === 'pending' && "bg-warning/10 text-warning border-warning/30",
                    submission.status === 'rejected' && "bg-destructive/10 text-destructive border-destructive/30"
                  )}>
                    {submission.status === 'approved' && 'Tasdiqlangan'}
                    {submission.status === 'pending' && 'Kutilmoqda'}
                    {submission.status === 'rejected' && 'Qaytarilgan'}
                  </Badge>
                  
                  <span className="text-sm text-muted-foreground">
                    {formatDate(submission.submitted_at)}
                  </span>
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}