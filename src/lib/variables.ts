export const API_BASE_URL = `${import.meta.env.VITE_API_KEY || 'http://127.0.0.1:8001/api'}`;


// WebSocket base URL — derived from API base; can be overridden with VITE_WS_URL.
export const WS_BASE_URL: string = (() => {
  const explicit = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  if (explicit) return explicit.replace(/\/$/, '');
  try {
    const u = new URL(API_BASE_URL);
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    // Drop trailing /api so consumers can append /ws/...
    const path = u.pathname.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${proto}//${u.host}${path}`;
  } catch {
    return 'ws://127.0.0.1:8001';
  }
})();

// Admin contact bot/link shown in the navbar. Replace with your Telegram bot or other URL.
export const ADMIN_CONTACT_URL = 'https://t.me/abdiyev_admin_bot';
export const ADMIN_CONTACT_LABEL = 'Admin bilan bog\'lanish';
