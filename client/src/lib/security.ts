// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;
const ZERO_WIDTH_CHARS = /[\u200B-\u200D\u2060\uFEFF]/g;

/** Same normalisation as the server: NFC, no control/zero-width characters, single spaces. */
export function cleanText(value: string, maxLength = Infinity): string {
  return value
    .normalize('NFC')
    .replace(CONTROL_CHARS, ' ')
    .replace(ZERO_WIDTH_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Open-redirect guard for `?next=`: only same-site paths are allowed.
 * Rejects `//evil.com`, `/\evil.com`, absolute URLs and `javascript:` URLs.
 */
export function safeNextPath(value: string | null | undefined, fallback = '/templates'): string {
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Only http(s) URLs may be rendered as image sources or links. */
export function safeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export const OBJECT_ID = /^[a-f\d]{24}$/i;
export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID.test(value);
