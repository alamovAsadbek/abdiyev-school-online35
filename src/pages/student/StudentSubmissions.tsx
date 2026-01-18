import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, Table2, Clock, CheckCircle2, XCircle, FileText, HelpCircle } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DataTable, Column } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submissionsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ViewMode = 'card' | 'table';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface Submission {
  id: string;
  task: number | { id: number; title: string };
  task_title?: string;
  status: 'pending' | 'approved' | 'rejected';
  score: number;
  total: number;
  text_content?: string;
  file?: string;
  feedback?: string;
  submitted_at: string;
}

export default function StudentSubmissions() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await submissionsApi.getMySubmissions();
      setSubmissions(res?.results || res || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast({ title: 'Xatolik', description: 'Ma\'lumotlar yuklanmadi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getTaskTitle = (submission: Submission) => {
    if (submission.task_title) return submission.task_title;
    if (typeof submission.task === 'object') return submission.task.title;
    return `Vazifa #${submission.task}`;
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = getTaskTitle(sub).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Tekshirilmoqda';
      case 'approved': return 'Tasdiqlandi';
      case 'rejected': return 'Qaytarildi';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/15 text-warning';
      case 'approved': return 'bg-green-500/15 text-green-600';
      case 'rejected': return 'bg-destructive/15 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const columns: Column<Submission>[] = [
    {
      key: 'task',
      header: 'Vazifa',
      sortable: true,
      render: (sub) => (
        <div>
          <p className="font-medium">{getTaskTitle(sub)}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(sub.submitted_at).toLocaleDateString('uz-UZ')}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Holat',
      render: (sub) => (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", getStatusClass(sub.status))}>
          {getStatusIcon(sub.status)}
          {getStatusText(sub.status)}
        </span>
      )
    },
    {
      key: 'score',
      header: 'Ball',
      render: (sub) => sub.total > 0 ? `${sub.score}/${sub.total}` : '-'
    },
    {
      key: 'feedback',
      header: 'Izoh',
      render: (sub) => sub.feedback || '-'
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Mening vazifalarim
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('card')}
              className={viewMode === 'card' ? 'gradient-primary text-primary-foreground' : ''}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'gradient-primary text-primary-foreground' : ''}
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Topshirgan vazifalaringiz va ularning holati
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Vazifa qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Holat bo'yicha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="pending">Tekshirilmoqda</SelectItem>
            <SelectItem value="approved">Tasdiqlangan</SelectItem>
            <SelectItem value="rejected">Qaytarilgan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {search || filterStatus !== 'all' ? "Hech qanday vazifa topilmadi" : "Hali topshirilgan vazifalar yo'q"}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubmissions.map((sub, index) => (
            <div
              key={sub.id}
              className="animate-fade-in rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all cursor-pointer"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              onClick={() => navigate(`/student/submission/${sub.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-card-foreground line-clamp-2">
                  {getTaskTitle(sub)}
                </h3>
                <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap", getStatusClass(sub.status))}>
                  {getStatusIcon(sub.status)}
                  {getStatusText(sub.status)}
                </span>
              </div>

              {sub.total > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Ball:</span>
                    <span className="font-medium">{sub.score}/{sub.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        sub.score === sub.total ? "bg-green-500" : 
                        sub.score >= sub.total / 2 ? "bg-warning" : "bg-destructive"
                      )}
                      style={{ width: `${(sub.score / sub.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {sub.feedback && (
                <div className="p-2 rounded-lg bg-muted/50 text-sm text-muted-foreground mb-3 line-clamp-2">
                  {sub.feedback}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Topshirilgan: {new Date(sub.submitted_at).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in">
          <DataTable
            data={filteredSubmissions}
            columns={columns}
            searchPlaceholder="Vazifa qidirish..."
            searchKeys={['task_title']}
            onRowClick={(sub) => navigate(`/student/submission/${sub.id}`)}
            emptyMessage="Hech qanday vazifa topilmadi"
          />
        </div>
      )}
    </DashboardLayout>
  );
}
