import { useEffect, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtectedImageViewerProps {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Image that opens fullscreen on click.
 * Prevents right-click, drag, download, and screen capture (via CSS protections).
 */
export function ProtectedImageViewer({ src, alt = '', className }: ProtectedImageViewerProps) {
  const [open, setOpen] = useState(false);

  // Block keyboard shortcuts (PrintScreen, Ctrl+S, Ctrl+P, Ctrl+Shift+S) while open
  useEffect(() => {
    if (!open) return;

    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        k === 'printscreen' ||
        (e.ctrlKey && (k === 's' || k === 'p' || k === 'u')) ||
        (e.ctrlKey && e.shiftKey && (k === 's' || k === 'i' || k === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (k === 'escape') setOpen(false);
    };

    const handleBlur = () => {
      // Hide image when window loses focus (helps prevent screen capture tools)
      const el = document.getElementById('protected-img-fullscreen');
      if (el) (el as HTMLImageElement).style.visibility = 'hidden';
    };
    const handleFocus = () => {
      const el = document.getElementById('protected-img-fullscreen');
      if (el) (el as HTMLImageElement).style.visibility = 'visible';
    };

    window.addEventListener('keydown', blockKeys, true);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', blockKeys, true);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.body.style.overflow = '';
    };
  }, [open]);

  const preventContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <div
        className={cn('relative inline-block cursor-zoom-in group', className)}
        onClick={() => setOpen(true)}
        onContextMenu={preventContextMenu}
        onDragStart={(e) => e.preventDefault()}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="rounded-lg border border-border max-w-full pointer-events-none select-none"
          style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition rounded-lg">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition drop-shadow" />
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          onContextMenu={preventContextMenu}
          style={{ touchAction: 'none' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            id="protected-img-fullscreen"
            src={src}
            alt={alt}
            draggable={false}
            onContextMenu={preventContextMenu}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain pointer-events-none select-none"
            style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60">
            Yuklab olish va skrinshot taqiqlangan
          </div>
        </div>
      )}
    </>
  );
}
