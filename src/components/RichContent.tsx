import { stripHtml } from '@/lib/richText';
import { cn } from '@/lib/utils';

interface RichContentProps {
  html?: string | null;
  className?: string;
  // When true, renders as HTML (sanitized-lite). When false, strips tags to plain text.
  asHtml?: boolean;
}

// Very small sanitizer: removes script/style/iframe/on* handlers. Not a full XSS shield,
// but the content originates from admin editors already used elsewhere in the app.
function sanitize(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/ on[a-z]+="[^"]*"/gi, '')
    .replace(/ on[a-z]+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export function RichContent({ html, className, asHtml = true }: RichContentProps) {
  if (!html) return null;
  if (!asHtml) {
    return <p className={className}>{stripHtml(html)}</p>;
  }
  return (
    <div
      className={cn('prose prose-sm max-w-none dark:prose-invert', className)}
      dangerouslySetInnerHTML={{ __html: sanitize(String(html)) }}
    />
  );
}
