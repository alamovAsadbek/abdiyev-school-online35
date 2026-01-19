import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, FileText, 
  Send, User, Calendar, Trophy, Download
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { submissionsApi, tasksApi } from '@/services/api';
import { cn, formatDate } from '@/lib/utils';

interface QuestionDetail {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  user_answer: number | null;
  is_correct: boolean;
}

interface SubmissionDetail {
  id: number;
  user: number;
  user_name: string;
  user_full_name: string;
  task: number;
  task_title: string;
  task_type: string;
  video_title: string;
  video?: number;
  file?: string;
  text_content?: string;
  answers: Record<string, number>;
  score: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  reviewed_at?: string;
  submitted_at: string;
  questions_detail?: QuestionDetail[];
}

export default function AdminSubmissionDetail() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [submissionId]);

  const loadData = async () => {
    try {
      const data = await submissionsApi.getDetailWithAnswers(submissionId!);
      setSubmission(data);
      setFeedback(data.feedback || '');
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({ title: 'Xatolik', description: 'Ma\'lumotlar yuklanmadi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await submissionsApi.approve(submissionId!, feedback);
      toast({ title: 'Muvaffaqiyat', description: 'Vazifa tasdiqlandi' });
      await loadData();
    } catch (error) {
      toast({ title: 'Xatolik', description: 'Xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast({ title: 'Xatolik', description: 'Qaytarish sababini yozing', variant: 'destructive' });
      return;
    }
    
    setSubmitting(true);
    try {
      await submissionsApi.reject(submissionId!, feedback);
      toast({ title: 'Muvaffaqiyat', description: 'Vazifa qaytarildi' });
      await loadData();
    } catch (error) {
      toast({ title: 'Xatolik', description: 'Xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setSubmitting(false);
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

  if (!submission) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground mb-4">Topshiriq topilmadi</p>
          <Button onClick={() => navigate(-1)}>Orqaga qaytish</Button>
        </div>
      </DashboardLayout>
    );
  }

  const isPending = submission.status === 'pending';
  const isApproved = submission.status === 'approved';
  const isRejected = submission.status === 'rejected';

  console.log('sub', submission)

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
        
        <Badge className={cn(
          "text-sm py-1 px-3",
          isApproved && "bg-green-500/10 text-green-600 border-green-500/30 hover:text-white",
          isPending && "bg-warning/10 text-warning border-warning/30",
          isRejected && "bg-destructive/10 text-destructive border-destructive/30"
        )}>
          {isApproved && 'Tasdiqlangan'}
          {isPending && 'Kutilmoqda'}
          {isRejected && 'Qaytarilgan'}
        </Badge>
      </div>

      <div className="w-full mx-auto">
        {/* Student & Task Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Student Info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                {submission.user_full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary cursor-pointer hover:text-success" onClick={()=>{
                  navigate(`/admin/users/${submission.user}`)
                }}>{submission.user_full_name}</h2>
                <p className="text-muted-foreground">@{submission.user_name}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Topshirilgan: {formatDate(submission.submitted_at)}</span>
              </div>
              {submission.reviewed_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Tekshirilgan: {formatDate(submission.reviewed_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Task Info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-2">Vazifa nomi: {submission.task_title}</h3>
            <p className="text-sm text-primary mb-4 cursor-pointer hover:text-success" onClick={()=>{
              navigate(`/admin/videos/${submission.video}`);
            }}>Dars nomi: {submission.video_title}</p>
            
            <div className="gap-4">
              {submission.task_type === 'test' && (
                  <div className="flex items-center gap-2">
                    <Trophy className={cn(
                        "h-5 w-5",
                        submission.score / submission.total >= 0.7 ? "text-green-600" :
                            submission.score / submission.total >= 0.5 ? "text-warning" : "text-destructive"
                    )} />
                    <span className="font-bold">
                    {submission.score}/{submission.total} ({((submission.score / submission.total) * 100).toFixed(0)}%)
                  </span>
                  </div>
              )}

              <Badge variant="outline" className='mt-4'>
                {submission.task_type === 'test' ? 'Test' : 
                 submission.task_type === 'file' ? 'Fayl yuklash' : 'Matn'}
              </Badge>
              

            </div>
          </div>
        </div>

        {/* Test Questions with Answers */}
        {submission.task_type === 'test' && submission.questions_detail && (
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground">Javoblar</h3>
            
            {submission.questions_detail.map((question, qIndex) => (
              <div 
                key={question.id}
                className={cn(
                  "rounded-xl border bg-card p-6",
                  question.is_correct ? "border-green-500/30" : "border-destructive/30"
                )}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg font-semibold text-sm",
                    question.is_correct ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                  )}>
                    {qIndex + 1}
                  </span>
                  <div 
                    className="font-medium text-card-foreground pt-1 prose prose-sm dark:prose-invert max-w-none flex-1"
                    dangerouslySetInnerHTML={{ __html: question.question }}
                  />
                  {question.is_correct ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-2 pl-11">
                  {question.options.map((option, oIndex) => {
                    const isUserAnswer = question.user_answer === oIndex;
                    const isCorrect = question.correct_answer === oIndex;
                    
                    return (
                      <div
                        key={oIndex}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          isCorrect && "border-green-500 bg-green-500/10",
                          isUserAnswer && !isCorrect && "border-destructive bg-destructive/10",
                          !isCorrect && !isUserAnswer && "border-border bg-muted/30"
                        )}
                      >
                        <span className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium",
                          isCorrect && "border-green-500 bg-green-500 text-white",
                          isUserAnswer && !isCorrect && "border-destructive bg-destructive text-white",
                          !isCorrect && !isUserAnswer && "border-muted-foreground/30"
                        )}>
                          {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : 
                           isUserAnswer ? <XCircle className="h-4 w-4" /> : 
                           String.fromCharCode(65 + oIndex)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {isUserAnswer && (
                          <span className="text-xs text-muted-foreground">O'quvchi javobi</span>
                        )}
                        {isCorrect && (
                          <span className="text-xs text-green-600">To'g'ri javob</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        {submission.text_content && (
          <div className="rounded-xl border border-border bg-card p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-4">O'quvchi javobi</h3>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/30 rounded-lg"
              dangerouslySetInnerHTML={{ __html: submission.text_content }}
            />
          </div>
        )}

        {/* File Download */}
        {submission.file && (
          <div className="rounded-xl border border-border bg-card p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-4">Yuklangan fayl</h3>
            <a 
              href={submission.file}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Faylni yuklab olish</p>
                <p className="text-sm text-muted-foreground">Bosib ko'ring</p>
              </div>
              <Download className="h-5 w-5 text-muted-foreground" />
            </a>
          </div>
        )}

        {/* Approval Section - Only for file/text tasks */}
        {submission.task_type !== 'test' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">
              {isPending ? 'Vazifani tekshirish' : 'Izoh'}
            </h3>
            
            <Textarea
              placeholder="O'quvchiga izoh yozing..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              disabled={!isPending}
              className="mb-4"
            />
            
            {isPending && (
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={submitting}
                  className="text-destructive hover:bg-destructive hover:text-white"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Qaytarish
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tasdiqlash
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}