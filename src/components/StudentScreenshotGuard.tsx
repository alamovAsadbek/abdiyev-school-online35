import { useEffect, useRef } from 'react';

/**
 * Best-effort screenshot / screen-record / save protection for student pages.
 * Cannot 100% block OS-level capture, but discourages it:
 *  - Disables right-click, drag, text selection, copy
 *  - Blocks PrintScreen, Ctrl/Cmd+S, Ctrl+P, Ctrl+U, Ctrl+Shift+S/I/C, F12
 *  - Blurs page when window loses focus or visibility changes
 *  - Detects devtools open (rough heuristic) and blurs content
 */
export function StudentScreenshotGuard() {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Inject CSS that disables user-select / pointer drag globally for the body
    const style = document.createElement('style');
    style.setAttribute('data-screenshot-guard', '');
    style.textContent = `
      body.sg-active, body.sg-active * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      body.sg-active img, body.sg-active video {
        -webkit-user-drag: none !important;
      }
      body.sg-blur #sg-blur-layer {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      #sg-blur-layer {
        position: fixed; inset: 0; z-index: 2147483646;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        color: white; display: flex; align-items: center; justify-content: center;
        font-family: system-ui, sans-serif; font-size: 14px;
        opacity: 0; pointer-events: none; transition: opacity .15s;
        text-align: center; padding: 24px;
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    document.body.classList.add('sg-active');

    // Overlay element shown when capture-like event detected
    let overlay = document.getElementById('sg-blur-layer') as HTMLDivElement | null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sg-blur-layer';
      overlay.textContent = 'Xavfsizlik: kontent yashirildi. Skrinshot / yozish taqiqlangan.';
      document.body.appendChild(overlay);
    }

    const showBlur = () => document.body.classList.add('sg-blur');
    const hideBlur = () => document.body.classList.remove('sg-blur');

    const onContext = (e: MouseEvent) => e.preventDefault();
    const onDrag = (e: DragEvent) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => e.preventDefault();
    const onSelect = (e: Event) => {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (k === 'printscreen') {
        showBlur();
        // Best-effort: clear clipboard
        try { navigator.clipboard?.writeText(''); } catch {}
        setTimeout(hideBlur, 1500);
        e.preventDefault();
        return;
      }
      if (k === 'f12') { e.preventDefault(); return; }
      if (ctrl && ['s', 'p', 'u', 'c', 'a'].includes(k)) { e.preventDefault(); return; }
      if (ctrl && e.shiftKey && ['s', 'i', 'c', 'j'].includes(k)) { e.preventDefault(); return; }
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') showBlur(); else hideBlur();
    };
    const onBlur = () => showBlur();
    const onFocus = () => hideBlur();

    // DevTools detection (rough heuristic via window size delta)
    const devtoolsInterval = window.setInterval(() => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        showBlur();
      } else if (document.hasFocus() && document.visibilityState === 'visible') {
        hideBlur();
      }
    }, 1000);

    window.addEventListener('contextmenu', onContext, true);
    window.addEventListener('dragstart', onDrag, true);
    window.addEventListener('copy', onCopy, true);
    window.addEventListener('cut', onCopy, true);
    window.addEventListener('selectstart', onSelect, true);
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(devtoolsInterval);
      window.removeEventListener('contextmenu', onContext, true);
      window.removeEventListener('dragstart', onDrag, true);
      window.removeEventListener('copy', onCopy, true);
      window.removeEventListener('cut', onCopy, true);
      window.removeEventListener('selectstart', onSelect, true);
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.body.classList.remove('sg-active', 'sg-blur');
      overlay?.remove();
      styleRef.current?.remove();
    };
  }, []);

  return null;
}
