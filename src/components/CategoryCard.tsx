import { ChevronRight, Video, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    description?: string;
    icon: string;
    video_count?: number;
    videoCount?: number;
    is_modular?: boolean;
    module_count?: number;
  };
  onClick: () => void;
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  const videoCount = category.video_count ?? category.videoCount ?? 0;
  
  return (
    <div 
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover-lift"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
          {category.icon}
        </div>
        <div className="flex items-center gap-2">
          {category.is_modular && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
              <Layers className="h-3 w-3" />
              <span>{category.module_count || 0}</span>
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
      
      <h3 className="font-semibold text-lg text-card-foreground mb-2">
        {category.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {category.description}
      </p>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Video className="h-4 w-4" />
        <span>{videoCount} ta video</span>
      </div>
    </div>
  );
}
