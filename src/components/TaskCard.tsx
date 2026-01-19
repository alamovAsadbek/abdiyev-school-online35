import { ClipboardList, CheckCircle2, ChevronRight } from 'lucide-react';
import { Task } from '@/data/demoData';
import { useProgress } from '@/contexts/ProgressContext';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { isTaskCompleted } = useProgress();
  const completed = isTaskCompleted(task.id);

  return (
    <div 
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover-lift"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          completed ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
        )}>
          {completed ? <CheckCircle2 className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
        </div>
        
        {completed ? (
          <div className="status-badge status-completed">
            Bajarildi
          </div>
        ) : (
          <div className="status-badge status-new">
            Yangi
          </div>
        )}
      </div>

      <h3 className="font-semibold text-card-foreground mb-1">
        {task.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {task.questions.length} ta savol
        </span>
        <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
          {completed ? 'Qayta ishlash' : 'Boshlash'}
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
