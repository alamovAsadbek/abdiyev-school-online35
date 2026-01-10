import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, XCircle, Trophy, Ban, PlayCircle, Lock, 
  Upload, FileText, Clock, Send, AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/RichTextEditor';
import { cn } from '@/lib/utils';
import { tasksApi, submissionsApi, videosApi, progressApi } from '@/services/api';

interface TaskQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  order: number;
}

interface Task {
  id: number;
  video: number;
  title: string;
  description: string;
  task_type: 'test' | 'file' | 'text';
  file?: string;
  allow_resubmission: boolean;
  requires_approval: boolean;
  questions: TaskQuestion[];
}

interface Submission {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  score: number;
  total: number;
  answers: Record<string, number>;
  text_content?: string;
  file?: string;
  feedback?: string;
  submitted_at: string;
}

export default function StudentTaskView() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [task, setTask] = useState<Task | null>(null);
  const [video, setVideo] = useState<any>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  
  // Form state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [textContent, setTextContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    try {
      // Load task
      const taskData = await tasksApi.getById(taskId!);
      setTask(taskData);
      
      // Load video
      if (taskData.video) {
        const videoData = await videosApi.getById(String(taskData.video));
        setVideo(videoData);
      }
      
      // Load user progress to check if video is completed
      const progressData = await progressApi.getMyProgress();
      const completedVideos = progressData.completed_videos || [];
      setVideoCompleted(completedVideos.includes(String(taskData.video)) || completedVideos.includes(taskData.video));
      
      // Load existing submission
      const submissions = await submissionsApi.getMySubmissions();
      const existing = submissions.find((s: any) => s.task === taskData.id);
      if (existing) {
        setSubmission(existing);
        setAnswers(existing.answers || {});
        setTextContent(existing.text_content || '');
        if (existing.status === 'approved' || (taskData.task_type === 'test' && existing.score !== undefined)) {
          setSubmitted(true);
          setScore({ correct: existing.score, total: existing.total });
        }
      }
    } catch (error) {
      console.error('Error loading task:', error);
      toast({ title: 'Xatolik', description: 'Vazifa yuklanmadi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (submitted && !task?.allow_resubmission) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!task) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('task_id', String(task.id));
      
      if (task.task_type === 'test') {
        // Calculate score
        let correct = 0;
        task.questions.forEach(q => {
          if (answers[String(q.id)] === q.correct_answer) {
            correct++;
          }
        });
        
        formData.append('answers', JSON.stringify(answers));
        formData.append('score', String(correct));
        formData.append('total', String(task.questions.length));
        
        await submissionsApi.submit(formData);
        
        setScore({ correct, total: task.questions.length });
        setSubmitted(true);
        
        // Mark task as completed
        await progressApi.completeTask(String(task.id));
        
        toast({ 
          title: 'Muvaffaqiyat', 
          description: `${correct}/${task.questions.length} to'g'ri javob` 
        });
      } else {
        // File or text submission
        if (task.task_type === 'file' && uploadedFile) {
          formData.append('file', uploadedFile);
        }
        if (textContent) {
          formData.append('text_content', textContent);
        }
        
        await submissionsApi.submit(formData);
        
        toast({ 
          title: 'Muvaffaqiyat', 
          description: task.requires_approval 
            ? "Vazifa yuborildi. O'qituvchi tasdiqlashini kuting." 
            : 'Vazifa yuborildi' 
        });
        
        // Reload to get updated submission
        await loadData();
      }
    } catch (error: any) {
      toast({ 
        title: 'Xatolik', 
        description: error.message || 'Vazifa yuborishda xatolik', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (!task?.allow_resubmission) return;
    setAnswers({});
    setTextContent('');
    setUploadedFile(null);
    setSubmitted(false);
    setScore(null);
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

  if (!task) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground mb-4">Vazifa topilmadi</p>
          <Button onClick={() => navigate('/student/tasks')}>Orqaga qaytish</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Video not watched - locked state
  if (!videoCompleted) {
    return (
      <DashboardLayout>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="mb-8 animate-fade-in rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Lock className="h-6 w-6" />
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
                className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
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
          </div>

          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Vazifa qulflangan</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Bu vazifani bajarish uchun avval tegishli video darsni ko'rishingiz kerak.
            </p>
            {video && (
              <Button 
                onClick={() => navigate(`/student/video/${video.id}`)}
                className="gradient-primary text-primary-foreground"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Darsni ko'rish
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const allAnswered = task.task_type === 'test' 
    ? task.questions.every(q => answers[String(q.id)] !== undefined)
    : (task.task_type === 'text' ? textContent.trim().length > 0 : uploadedFile !== null || textContent.trim().length > 0);

  // Check if can submit
  const canSubmit = allAnswered && (!submission || task.allow_resubmission);
  
  // Check submission status for file/text tasks
  const isPending = submission?.status === 'pending';
  const isApproved = submission?.status === 'approved';
  const isRejected = submission?.status === 'rejected';

  return (
    <DashboardLayout>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Orqaga
      </Button>

      <div className="max-w-3xl mx-auto">
        {/* Task Info Header */}
        <div className="mb-8 animate-fade-in rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
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
            {task.task_type === 'test' && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Savollar soni:</span>
                <span className="font-medium text-foreground">{task.questions.length} ta</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Qayta topshirish:</span>
              <span className={cn("font-medium", task.allow_resubmission ? "text-green-600" : "text-muted-foreground")}>
                {task.allow_resubmission ? "Ruxsat berilgan" : "Yo'q"}
              </span>
            </div>
          </div>
        </div>

        {/* Submission Status for File/Text tasks */}
        {submission && task.task_type !== 'test' && (
          <div className={cn(
            "mb-8 p-6 rounded-xl border animate-scale-in",
            isPending && "bg-warning/10 border-warning/30",
            isApproved && "bg-green-500/10 border-green-500/30",
            isRejected && "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                isPending && "bg-warning/20 text-warning",
                isApproved && "bg-green-500/20 text-green-600",
                isRejected && "bg-destructive/20 text-destructive"
              )}>
                {isPending && <Clock className="h-7 w-7" />}
                {isApproved && <CheckCircle2 className="h-7 w-7" />}
                {isRejected && <XCircle className="h-7 w-7" />}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {isPending && "Tekshirilmoqda"}
                  {isApproved && "Tasdiqlandi"}
                  {isRejected && "Qaytarildi"}
                </h3>
                <p className="text-muted-foreground">
                  {isPending && "O'qituvchi javobingizni tekshirmoqda. Biroz kuting."}
                  {isApproved && "Vazifangiz muvaffaqiyatli tasdiqlandi!"}
                  {isRejected && "Vazifangiz qaytarildi. Qayta topshiring."}
                </p>
                {submission.feedback && (
                  <p className="mt-2 text-sm p-2 rounded bg-muted">
                    <strong>O'qituvchi izohi:</strong> {submission.feedback}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Score Result for Tests */}
        {submitted && score && task.task_type === 'test' && (
          <div className={cn(
            "mb-8 p-6 rounded-xl border animate-scale-in",
            score.correct === score.total 
              ? "bg-green-500/10 border-green-500/30" 
              : score.correct >= score.total / 2
                ? "bg-warning/10 border-warning/30"
                : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                score.correct === score.total 
                  ? "bg-green-500/20 text-green-600" 
                  : score.correct >= score.total / 2
                    ? "bg-warning/20 text-warning"
                    : "bg-destructive/20 text-destructive"
              )}>
                <Trophy className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {score.correct}/{score.total} to'g'ri javob
                </h3>
                <p className="text-muted-foreground">
                  {score.correct === score.total 
                    ? "Ajoyib! Barcha javoblar to'g'ri!" 
                    : score.correct >= score.total / 2
                      ? "Yaxshi natija! Davom eting."
                      : "Qaytadan urinib ko'ring."}
                </p>
              </div>
            </div>
            {!task.allow_resubmission && (
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-muted-foreground">
                <Ban className="h-4 w-4" />
                <span className="text-sm">Bu vazifani qayta topshirish mumkin emas</span>
              </div>
            )}
          </div>
        )}

        {/* Test Questions */}
        {task.task_type === 'test' && (
          <div className="space-y-6">
            {task.questions.map((question, qIndex) => {
              const selectedAnswer = answers[String(question.id)];
              const isCorrect = submitted && selectedAnswer === question.correct_answer;
              const isWrong = submitted && selectedAnswer !== undefined && selectedAnswer !== question.correct_answer;

              return (
                <div 
                  key={question.id}
                  className="animate-fade-in rounded-xl border border-border bg-card p-6"
                  style={{ animationDelay: `${0.1 + qIndex * 0.05}s` }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                      {qIndex + 1}
                    </span>
                    <div 
                      className="font-medium text-card-foreground pt-1 prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: question.question }}
                    />
                  </div>

                  <div className="space-y-3 pl-11">
                    {question.options.map((option, oIndex) => {
                      const isSelected = selectedAnswer === oIndex;
                      const showCorrect = submitted && oIndex === question.correct_answer;
                      const showWrong = submitted && isSelected && oIndex !== question.correct_answer;

                      return (
                        <button
                          key={oIndex}
                          onClick={() => handleSelectAnswer(String(question.id), oIndex)}
                          disabled={submitted && !task.allow_resubmission}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all",
                            !submitted && isSelected && "border-primary bg-primary/5",
                            !submitted && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                            showCorrect && "border-green-500 bg-green-500/10",
                            showWrong && "border-destructive bg-destructive/10",
                            submitted && !showCorrect && !showWrong && "opacity-60"
                          )}
                        >
                          <span className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium",
                            isSelected && !submitted && "border-primary bg-primary text-primary-foreground",
                            showCorrect && "border-green-500 bg-green-500 text-white",
                            showWrong && "border-destructive bg-destructive text-destructive-foreground",
                            !isSelected && !showCorrect && !showWrong && "border-muted-foreground/30"
                          )}>
                            {showCorrect ? <CheckCircle2 className="h-4 w-4" /> : 
                             showWrong ? <XCircle className="h-4 w-4" /> : 
                             String.fromCharCode(65 + oIndex)}
                          </span>
                          <span className="flex-1">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* File/Text Submission Form */}
        {(task.task_type === 'file' || task.task_type === 'text') && (!submission || isRejected || task.allow_resubmission) && (
          <div className="space-y-6">
            {/* Text Input with Rich Editor */}
            <div className="animate-fade-in rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">
                {task.task_type === 'file' ? 'Javobingizni yozing yoki fayl yuklang' : 'Javobingizni yozing'}
              </h3>
              
              <RichTextEditor
                value={textContent}
                onChange={setTextContent}
                placeholder="Javobingizni bu yerga yozing... Kimyoviy formulalar uchun subscript/superscript ishlating"
                className="min-h-[200px]"
              />
            </div>

            {/* File Upload */}
            {task.task_type === 'file' && (
              <div className="animate-fade-in rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Fayl yuklash (ixtiyoriy)</h3>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {uploadedFile ? (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-primary" />
                      <p className="font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="font-medium text-foreground">Fayl yuklash uchun bosing</p>
                      <p className="text-sm text-muted-foreground">PDF, Word, Excel, Rasm</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task file download if provided */}
            {task.file && (
              <div className="animate-fade-in rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Vazifa fayli</h3>
                <a 
                  href={task.file} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Vazifa faylini yuklab olish</p>
                    <p className="text-sm text-muted-foreground">Bosib yuklab oling</p>
                  </div>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-4">
          {task.task_type === 'test' ? (
            submitted ? (
              task.allow_resubmission ? (
                <Button onClick={handleRetry} className="gradient-primary text-primary-foreground">
                  Qayta ishlash
                </Button>
              ) : (
                <Button onClick={() => navigate('/student/tasks')} variant="outline">
                  Vazifalar ro'yxatiga qaytish
                </Button>
              )
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit || submitting}
                className="gradient-primary text-primary-foreground"
              >
                {submitting ? 'Yuklanmoqda...' : 'Javoblarni tekshirish'}
              </Button>
            )
          ) : (
            (!submission || isRejected || task.allow_resubmission) && (
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit || submitting || isPending}
                className="gradient-primary text-primary-foreground"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Yuklanmoqda...' : isPending ? 'Tekshirilmoqda' : 'Javobni yuborish'}
              </Button>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}