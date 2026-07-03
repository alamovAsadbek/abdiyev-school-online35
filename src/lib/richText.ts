// Utility for rendering / cleaning rich text produced by editors that emit HTML.
// Used to prevent raw HTML tags from being displayed as text in card summaries
// and to render sanitized HTML in detail views.

const BLOCK_TAGS = /<\/(p|div|br|li|h[1-6]|tr)>/gi;
const ANY_TAG = /<[^>]+>/g;
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function stripHtml(input?: string | null): string {
  if (!input) return '';
  const withSpaces = String(input).replace(BLOCK_TAGS, ' ');
  const noTags = withSpaces.replace(ANY_TAG, '');
  const decoded = noTags.replace(/&[a-z#0-9]+;/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? ' ');
  return decoded.replace(/\s+/g, ' ').trim();
}

export function hasHtml(input?: string | null): boolean {
  if (!input) return false;
  return /<[^>]+>/.test(String(input));
}
