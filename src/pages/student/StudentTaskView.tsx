import {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    ArrowLeft, CheckCircle2, XCircle, Trophy, Ban, PlayCircle, Lock,
    Upload, FileText, Clock, Send, AlertCircle, ChevronRight
} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {RichTextEditor} from '@/components/RichTextEditor';
import {cn} from '@/lib/utils';
import {tasksApi, submissionsApi, videosApi, progressApi} from '@/services/api';
import {useProgress} from '@/contexts/ProgressContext';

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

interface Video {
    id: string;
    title: string;
    category: string;
    category_name: string;
    order: number;
}

export default function StudentTaskView() {
    const {taskId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {isVideoCompleted, markVideoCompleted, markTaskCompleted} = useProgress();

    const [task, setTask] = useState<Task | null>(null);
    const [video, setVideo] = useState<Video | null>(null);
    const [nextVideo, setNextVideo] = useState<Video | null>(null);
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

            // Load video info (just for display, no permission check)
            if (taskData.video) {
                try {
                    const videoData = await videosApi.getById(String(taskData.video));
                    setVideo(videoData);

                    // Find next video in same category
                    try {
                        const categoryVideos = await videosApi.getByCategory(String(videoData.category));
                        const videos = (categoryVideos?.results || categoryVideos || []).sort((a: Video, b: Video) => a.order - b.order);
                        const currentIndex = videos.findIndex((v: Video) => String(v.id) === String(videoData.id));
                        if (currentIndex >= 0 && currentIndex < videos.length - 1) {
                            setNextVideo(videos[currentIndex + 1]);
                        }
                    } catch {
                        // No next video
                    }
                } catch {
                    // Video not found
                }
            }

            // ALWAYS allow task completion - no video watch check
            setVideoCompleted(true);

            // Load existing submission
            try {
                const submissions = await submissionsApi.getMySubmissions();
                const existing = (submissions?.results || submissions || []).find((s: any) =>
                    String(s.task) === String(taskData.id) || String(s.task?.id) === String(taskData.id)
                );
                if (existing) {
                    setSubmission(existing);
                    setAnswers(existing.answers || {});
                    setTextContent(existing.text_content || '');
                    if (existing.status === 'approved' || (taskData.task_type === 'test' && existing.score !== undefined)) {
                        setSubmitted(true);
                        setScore({correct: existing.score, total: existing.total});
                    }
                }
            } catch {
                // No submission
            }
        } catch (error) {
            console.error('Error loading task:', error);
            toast({title: 'Xatolik', description: 'Vazifa yuklanmadi', variant: 'destructive'});
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = (questionId: string, optionIndex: number) => {
        if (submitted && !task?.allow_resubmission) return;
        setAnswers(prev => ({...prev, [questionId]: optionIndex}));
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

                setScore({correct, total: task.questions.length});
                setSubmitted(true);

                // Mark task and video as completed in local context
                markTaskCompleted(String(task.id), correct, task.questions.length);
                if (video) {
                    markVideoCompleted(String(video.id));
                }

                // Also mark on backend
                try {
                    await progressApi.completeTask(String(task.id));
                } catch {
                    toast({
                        title: 'Xatolik',
                        description: 'Vazifa yuklanmadi',
                        variant: 'destructive',
                    })
                }

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

    const handleGoToNextVideo = () => {
        if (nextVideo) {
            navigate(`/student/video/${nextVideo.id}`);
        } else {
            navigate('/student/tasks');
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
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Orqaga
                </Button>

                <div className="w-full mx-auto">
                    <div className="mb-8 animate-fade-in rounded-xl border border-border bg-card p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <Lock className="h-6 w-6"/>
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-foreground mb-1">{task.title}</h1>
                                <div
                                    className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{__html: task.description || ''}}
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
                                    <PlayCircle className="h-5 w-5 text-primary ml-auto"/>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center w-full text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                            <Lock className="h-8 w-8 text-muted-foreground"/>
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
                                <PlayCircle className="mr-2 h-4 w-4"/>
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
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Orqaga
            </Button>

            <div className="w-full mx-auto">
                {/* Task Info Header */}
                <div className="mb-8 animate-fade-in rounded-xl border border-border bg-card p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CheckCircle2 className="h-6 w-6"/>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-foreground mb-1">{task.title}</h1>
                            <div
                                className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{__html: task.description || ''}}
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
                                <PlayCircle className="h-5 w-5 text-primary ml-auto"/>
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
                            <span
                                className={cn("font-medium", task.allow_resubmission ? "text-green-600" : "text-muted-foreground")}>
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
                                {isPending && <Clock className="h-7 w-7"/>}
                                {isApproved && <CheckCircle2 className="h-7 w-7"/>}
                                {isRejected && <XCircle className="h-7 w-7"/>}
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

                        {/* Next video button for approved */}
                        {isApproved && nextVideo && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                                <Button
                                    onClick={handleGoToNextVideo}
                                    className="w-full gradient-primary text-primary-foreground"
                                >
                                    Keyingi darsga o'tish
                                    <ChevronRight className="ml-2 h-4 w-4"/>
                                </Button>
                            </div>
                        )}
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
                                <Trophy className="h-7 w-7"/>
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

                        {/* Next video button for test completion */}
                        <div className="mt-4 pt-4 border-t border-border/50 flex gap-3">
                            {task.allow_resubmission && (
                                <Button
                                    variant="outline"
                                    onClick={handleRetry}
                                    className="flex-1"
                                >
                                    Qayta topshirish
                                </Button>
                            )}
                            <Button
                                onClick={handleGoToNextVideo}
                                className="flex-1 gradient-primary text-primary-foreground"
                            >
                                {nextVideo ? "Keyingi darsga o'tish" : "Darslarga qaytish"}
                                <ChevronRight className="ml-2 h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Test Questions */}
                {task.task_type === 'test' && !submitted && (
                    <div className="space-y-6">
                        {task.questions.map((question, qIndex) => {
                            const selectedAnswer = answers[String(question.id)];

                            return (
                                <div
                                    key={question.id}
                                    className="animate-fade-in rounded-xl border border-border bg-card p-6"
                                    style={{animationDelay: `${0.1 + qIndex * 0.05}s`}}
                                >
                                    <div className="flex items-start gap-3 mb-4">
                    <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                      {qIndex + 1}
                    </span>
                                        <div
                                            className="font-medium text-card-foreground pt-1 prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{__html: question.question}}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                                        {question.options.map((option, optIndex) => (
                                            <button
                                                key={optIndex}
                                                onClick={() => handleSelectAnswer(String(question.id), optIndex)}
                                                className={cn(
                                                    "p-4 rounded-lg border text-left transition-all",
                                                    selectedAnswer === optIndex
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                                                )}
                                            >
                        <span className="flex items-center gap-3">
                          <span className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                              selectedAnswer === optIndex
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                          )}>
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span dangerouslySetInnerHTML={{__html: option}}/>
                        </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Submit Button for Test */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={!canSubmit || submitting}
                                className="gradient-primary text-primary-foreground"
                                size="lg"
                            >
                                {submitting ? (
                                    <>
                                        <div
                                            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                                        Yuborilmoqda...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4"/>
                                        Javoblarni yuborish
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* File/Text submission form */}
                {task.task_type !== 'test' && !isApproved && (!submission || isRejected || task.allow_resubmission) && (
                    <div className="animate-fade-in rounded-xl border border-border bg-card p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-foreground">Javobingizni yuboring</h3>

                        {/* Rich Text Editor */}
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">Matn yozing yoki fayl yuklang</p>
                            <RichTextEditor
                                value={textContent}
                                onChange={setTextContent}
                                placeholder="Vazifa javobingizni bu yerga yozing... Kimyoviy formulalar uchun subscript/superscript ishlating"
                            />
                        </div>

                        {/* File Upload */}
                        {(task.task_type === 'file' || task.task_type === 'text') && (
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-24 border-dashed"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="h-6 w-6 text-muted-foreground"/>
                                        {uploadedFile ? (
                                            <span className="text-sm text-foreground">{uploadedFile.name}</span>
                                        ) : (
                                            <span
                                                className="text-sm text-muted-foreground">Fayl yuklash uchun bosing</span>
                                        )}
                                    </div>
                                </Button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={!allAnswered || submitting}
                            className="w-full gradient-primary text-primary-foreground"
                            size="lg"
                        >
                            {submitting ? (
                                <>
                                    <div
                                        className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                                    Yuborilmoqda...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4"/>
                                    Vazifani yuborish
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
