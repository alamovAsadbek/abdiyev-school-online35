import { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SecureVideoPlayerProps {
  videoUrl: string;
  title: string;
  watermarkId: string;
  onComplete?: () => void;
  className?: string;
}

export function SecureVideoPlayer({ 
  videoUrl, 
  title, 
  watermarkId, 
  onComplete,
  className 
}: SecureVideoPlayerProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 20, y: 20 });

  // Move watermark randomly to prevent overlay removal
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPosition({
        x: Math.random() * 60 + 10,
        y: Math.random() * 60 + 10,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Prevent right-click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: 'Ruxsat berilmagan',
      description: 'Bu video himoyalangan',
      variant: 'destructive',
    });
  }, [toast]);

  // Prevent keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setIsBlurred(true);
        toast({
          title: 'Skrinshot taqiqlangan',
          description: 'Bu video himoyalangan',
          variant: 'destructive',
        });
        setTimeout(() => setIsBlurred(false), 2000);
      }
      
      // Prevent Ctrl+P, Ctrl+S, Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'P', 'S'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  // Detect screen recording / visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
      }
    };

    // Detect if DevTools is open
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', detectDevTools);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', detectDevTools);
    };
  }, []);

  // Prevent drag
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Check if URL is YouTube or other embed
  const isEmbedUrl = videoUrl?.includes('youtube.com') || 
                     videoUrl?.includes('youtu.be') || 
                     videoUrl?.includes('vimeo.com');

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video rounded-xl overflow-hidden bg-black select-none",
        isBlurred && "blur-xl",
        className
      )}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {isEmbedUrl ? (
        <iframe
          src={videoUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ pointerEvents: 'auto' }}
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onEnded={onComplete}
          style={{ pointerEvents: 'auto' }}
        >
          Sizning brauzeringiz video formatni qo'llab-quvvatlamaydi.
        </video>
      )}

      {/* Floating Watermark */}
      <div
        className="absolute pointer-events-none select-none z-10 transition-all duration-1000"
        style={{
          left: `${watermarkPosition.x}%`,
          top: `${watermarkPosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
          <p className="text-white/70 text-xs font-mono font-bold tracking-wider">
            ID: {watermarkId}
          </p>
        </div>
      </div>

      {/* Static corner watermark */}
      <div className="absolute bottom-4 right-4 pointer-events-none select-none z-10">
        <div className="bg-black/40 backdrop-blur-sm rounded px-2 py-1">
          <p className="text-white/50 text-[10px] font-mono">
            {watermarkId}
          </p>
        </div>
      </div>

      {/* Protection overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'transparent',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Blur overlay when screenshot detected */}
      {isBlurred && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center text-white">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-warning" />
            <p className="font-semibold">Himoyalangan kontent</p>
            <p className="text-sm text-muted-foreground">Skrinshot olish taqiqlangan</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecureVideoPlayer;