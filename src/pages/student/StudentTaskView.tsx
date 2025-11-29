import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Ban, PlayCircle, Lock } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/contexts/ProgressContext';
import { useToast } from '@/hooks/use-toast';
import { demoTasks, demoVideos, demoCategories } from '@/data/demoData';
import { cn } from '@/lib/utils';

export default function StudentTaskView() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { markTaskCompleted, getTaskScore, progress, isVideoCompleted } = useProgress();
  const { toast } = useToast();
  
  const task = demoTasks.find(t => t.id === taskId);
  const video = task ? demoVideos.find(v => v.id === task.videoId) : null;
  const category = video ? demoCategories.find(c => c.id === video.categoryId) : null;
  
  const existingScore = task ? getTaskScore(task.id) : null;
  const isAlreadyCompleted = task ? progress.completedTasks.includes(task.id) : false;
  const canRetake = task?.allowResubmission || false;
  const videoWatched = video ? isVideoCompleted(video.id) : false;
  
  const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
  const [submitted, setSubmitted] = useState(isAlreadyCompleted && !canRetake);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    existingScore ? { correct: existingScore.score, total: existingScore.total } : null
  );

  if (!task) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground mb-4">Vazifa topilmadi</p>
          <Button onClick={() => navigate('/student/tasks')}>
            Orqaga qaytish
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // If video not watched, show locked state
  if (!videoWatched) {
    return (
      <DashboardLayout>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <div className="max-w-3xl mx-auto">
          {/* Task Info Header */}
          <div className="mb-8 animate-fade-in rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Lock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {task.title}
                </h1>
                <p className="text-muted-foreground">{task.description}</p>
              </div>
            </div>

            {/* Video Link */}
            {video && category && (
              <div 
                className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => navigate(`/student/video/${video.id}`)}
              >
                <p className="text-sm text-muted-foreground mb-1">Bu vazifa quyidagi dars uchun:</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                    {category.icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{video.title}</p>
                    <p className="text-sm text-muted-foreground">{category.name}</p>
                  </div>
                  <PlayCircle className="h-5 w-5 text-primary ml-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Locked Message */}
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Vazifa qulflangan
            </h3>
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

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    let correct = 0;
    task.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    
    setScore({ correct, total: task.questions.length });
    setSubmitted(true);
    markTaskCompleted(task.id, correct, task.questions.length);
  };

  const handleRetry = () => {
    if (!canRetake) return;
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  const allAnswered = task.questions.every(q => answers[q.id] !== undefined);

  return (
    <DashboardLayout>
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 -ml-2"
      >
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
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {task.title}
              </h1>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
          </div>

          {/* Video Link */}
          {video && category && (
            <div 
              className="mt-4 p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => navigate(`/student/video/${video.id}`)}
            >
              <p className="text-sm text-muted-foreground mb-1">Bu vazifa quyidagi dars uchun:</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                  {category.icon}
                </div>
                <div>
                  <p className="font-medium text-foreground">{video.title}</p>
                  <p className="text-sm text-muted-foreground">{category.name}</p>
                </div>
                <PlayCircle className="h-5 w-5 text-primary ml-auto" />
              </div>
            </div>
          )}

          {/* Task Stats */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Savollar soni:</span>
              <span className="font-medium text-foreground">{task.questions.length} ta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Qayta topshirish:</span>
              <span className={cn(
                "font-medium",
                task.allowResubmission ? "text-success" : "text-muted-foreground"
              )}>
                {task.allowResubmission ? "Ruxsat berilgan" : "Yo'q"}
              </span>
            </div>
          </div>
        </div>

        {/* Score Result */}
        {submitted && score && (
          <div className={cn(
            "mb-8 p-6 rounded-xl border animate-scale-in",
            score.correct === score.total 
              ? "bg-success/10 border-success/30" 
              : score.correct >= score.total / 2
                ? "bg-warning/10 border-warning/30"
                : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                score.correct === score.total 
                  ? "bg-success/20 text-success" 
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
            {!canRetake && isAlreadyCompleted && (
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-muted-foreground">
                <Ban className="h-4 w-4" />
                <span className="text-sm">Bu vazifani qayta topshirish mumkin emas</span>
              </div>
            )}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {task.questions.map((question, qIndex) => {
            const selectedAnswer = answers[question.id];
            const isCorrect = submitted && selectedAnswer === question.correctAnswer;
            const isWrong = submitted && selectedAnswer !== undefined && selectedAnswer !== question.correctAnswer;

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
                  <h3 className="font-medium text-card-foreground pt-1">
                    {question.question}
                  </h3>
                </div>

                <div className="space-y-3 pl-11">
                  {question.options.map((option, oIndex) => {
                    const isSelected = selectedAnswer === oIndex;
                    const showCorrect = submitted && oIndex === question.correctAnswer;
                    const showWrong = submitted && isSelected && oIndex !== question.correctAnswer;

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleSelectAnswer(question.id, oIndex)}
                        disabled={submitted}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all",
                          !submitted && isSelected && "border-primary bg-primary/5",
                          !submitted && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                          showCorrect && "border-success bg-success/10",
                          showWrong && "border-destructive bg-destructive/10",
                          submitted && !showCorrect && !showWrong && "opacity-60"
                        )}
                      >
                        <span className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium",
                          isSelected && !submitted && "border-primary bg-primary text-primary-foreground",
                          showCorrect && "border-success bg-success text-success-foreground",
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

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-4">
          {submitted ? (
            canRetake ? (
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
              disabled={!allAnswered}
              className="gradient-primary text-primary-foreground"
            >
              Javoblarni tekshirish
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}