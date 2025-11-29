import { Play, Clock, CheckCircle2, Lock } from 'lucide-react';
import { Video } from '@/data/demoData';
import { useProgress } from '@/contexts/ProgressContext';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  isLocked?: boolean;
}

export function VideoCard({ video, onClick, isLocked = false }: VideoCardProps) {
  const { isVideoCompleted } = useProgress();
  const completed = isVideoCompleted(video.id);

  const handleClick = () => {
    if (!isLocked) {
      onClick();
    }
  };

  return (
    <div 
      className={cn(
        "video-card group hover-lift",
        isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500",
            !isLocked && "group-hover:scale-105"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Play Button or Lock */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
          isLocked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {isLocked ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/90 text-muted-foreground shadow-lg">
              <Lock className="h-6 w-6" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
              <Play className="h-6 w-6 ml-1" />
            </div>
          )}
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
          <Clock className="h-3 w-3" />
          {video.duration}
        </div>

        {/* Completed Badge */}
        {completed && (
          <div className="absolute top-2 right-2">
            <div className="status-badge status-completed">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ko'rildi
            </div>
          </div>
        )}

        {/* Locked Badge */}
        {isLocked && (
          <div className="absolute top-2 left-2">
            <div className="status-badge bg-muted text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Qulflangan
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-card-foreground line-clamp-1 mb-1">
          {video.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {video.description}
        </p>
      </div>
    </div>
  );
}