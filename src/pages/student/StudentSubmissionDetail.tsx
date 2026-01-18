import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, FileText, Download, PlayCircle } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { submissionsApi, tasksApi, videosApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  order: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  task_type: 'test' | 'file' | 'text';
  video: number;
  questions: TaskQuestion[];
}

interface Video {
  id: string;
  title: string;
  category_name: string;
}

interface Submission {
  id: string;
  task: number;
  task_title?: string;
  status: 'pending' | 'approved' | 'rejected';
  score: number;
  total: number;
  answers: Record<string, number>;
  text_content?: string;
  file?: string;
  feedback?: string;
  submitted_at: string;
}

export default function StudentSubmissionDetail() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [submissionId]);

  const loadData = async () => {
    try {
      const subData = await submissionsApi.getById(submissionId!);
      setSubmission(subData);
      
      // Load task
      const taskId = typeof subData.task === 'object' ? subData.task.id : subData.task;
      const taskData = await tasksApi.getById(String(taskId));
      setTask(taskData);
      
      // Load video
      if (taskData.video) {
        try {
          const videoData = await videosApi.getById(String(taskData.video));
          setVideo(videoData);
        } catch {}
      }
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({ title: 'Xatolik', description: 'Ma\'lumotlar yuklanmadi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-7 w-7" />,
          text: 'Tekshirilmoqda',
          description: "O'qituvchi javobingizni tekshirmoqda. Biroz kuting.",
          bgClass: 'bg-warning/10 border-warning/30',
          iconClass: 'bg-warning/20 text-warning'
        };
      case 'approved':
        return {
          icon: <CheckCircle2 className="h-7 w-7" />,
          text: 'Tasdiqlandi',
          description: 'Vazifangiz muvaffaqiyatli tasdiqlandi!',
          bgClass: 'bg-green-500/10 border-green-500/30',
          iconClass: 'bg-green-500/20 text-green-600'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-7 w-7" />,
          text: 'Qaytarildi',
          description: 'Vazifangiz qaytarildi. Qayta topshiring.',
          bgClass: 'bg-destructive/10 border-destructive/30',
          iconClass: 'bg-destructive/20 text-destructive'
        };
      default:
        return {
          icon: <FileText className="h-7 w-7" />,
          text: status,
          description: '',
          bgClass: 'bg-muted border-border',
          iconClass: 'bg-muted text-muted-foreground'
        };
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

  if (!submission || !task) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground mb-4">Vazifa topilmadi</p>
          <Button onClick={() => navigate('/student/tasks')}>Orqaga qaytish</Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusInfo = getStatusInfo(submission.status);

  return (
    <DashboardLayout>
      <Button variant="ghost" onClick={() => navigate('/student/tasks')} className="mb-6 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Orqaga
      </Button>

      <div className="max-w-3xl mx-auto">
        {/* Task Info Header */}
        <div className="mb-8 animate-fade-in rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-1">{task.title}</h1>
              <div 
                className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: task.description || '' }}
              />
            </div>
          </div>

          {video && (
            <div 
              className="mt-4 p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => navigate(`/student/video/${video.id}`)}
            >
              <p className="text-sm text-muted-foreground mb-1">Bu vazifa quyidagi dars uchun:</p>
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-foreground">{video.title}</p>
                  <p className="text-sm text-muted-foreground">{video.category_name}</p>
                </div>
                <PlayCircle className="h-5 w-5 text-primary ml-auto" />
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Vazifa turi:</span>
              <span className="font-medium text-foreground">
                {task.task_type === 'test' ? 'Test' : task.task_type === 'file' ? 'Fayl yuklash' : 'Matn yozish'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Topshirilgan:</span>
              <span className="font-medium text-foreground">
                {new Date(submission.submitted_at).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className={cn("mb-8 p-6 rounded-xl border animate-scale-in", statusInfo.bgClass)}>
          <div className="flex items-center gap-4">
            <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", statusInfo.iconClass)}>
              {statusInfo.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{statusInfo.text}</h3>
              <p className="text-muted-foreground">{statusInfo.description}</p>
              {submission.feedback && (
                <p className="mt-2 text-sm p-2 rounded bg-muted">
                  <strong>O'qituvchi izohi:</strong> {submission.feedback}
                </p>
              )}
            </div>
          </div>

          {/* Score for test */}
          {task.task_type === 'test' && submission.total > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Natija:</span>
                <span className="text-xl font-bold">{submission.score}/{submission.total}</span>
              </div>
              <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all",
                    submission.score === submission.total ? "bg-green-500" : 
                    submission.score >= submission.total / 2 ? "bg-warning" : "bg-destructive"
                  )}
                  style={{ width: `${(submission.score / submission.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Test Answers */}
        {task.task_type === 'test' && task.questions && task.questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Javoblaringiz</h2>
            {task.questions.map((question, qIndex) => {
              const userAnswer = submission.answers?.[String(question.id)];
              const isCorrect = userAnswer === question.correct_answer;
              
              return (
                <div 
                  key={question.id}
                  className={cn(
                    "rounded-xl border p-5",
                    isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg font-semibold text-sm",
                      isCorrect ? "bg-green-500/20 text-green-600" : "bg-destructive/20 text-destructive"
                    )}>
                      {qIndex + 1}
                    </span>
                    <div 
                      className="font-medium text-card-foreground pt-1 prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: question.question }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                    {question.options.map((option, optIndex) => {
                      const isUserAnswer = userAnswer === optIndex;
                      const isCorrectAnswer = question.correct_answer === optIndex;
                      
                      return (
                        <div
                          key={optIndex}
                          className={cn(
                            "p-3 rounded-lg border text-sm",
                            isCorrectAnswer 
                              ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400" 
                              : isUserAnswer && !isCorrectAnswer
                                ? "border-destructive bg-destructive/10 text-destructive"
                                : "border-border bg-muted/30"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium",
                              isCorrectAnswer 
                                ? "bg-green-500 text-white" 
                                : isUserAnswer
                                  ? "bg-destructive text-white"
                                  : "bg-muted text-muted-foreground"
                            )}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span dangerouslySetInnerHTML={{ __html: option }} />
                            {isCorrectAnswer && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                            {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Text/File Submission Content */}
        {task.task_type !== 'test' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Sizning javobingiz</h2>
            
            {submission.text_content && (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: submission.text_content }}
              />
            )}

            {submission.file && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Yuklangan fayl</p>
                  <p className="text-xs text-muted-foreground">
                    {submission.file.split('/').pop()}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={submission.file} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Yuklab olish
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/student/tasks')}
            className="flex-1"
          >
            Vazifalar ro'yxatiga qaytish
          </Button>
          {video && (
            <Button 
              onClick={() => navigate(`/student/video/${video.id}`)}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              Darsni ko'rish
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
