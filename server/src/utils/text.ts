// Control characters (except tab/newline, which become spaces below) and invisible
// zero-width characters are never meaningful in names or search terms.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const ZERO_WIDTH_CHARS = /[\u200B-\u200D\u2060\uFEFF]/g;

/**
 * Normalises free text from users: Unicode NFC, strips control and zero-width
 * characters, collapses whitespace runs and trims.
 */
export function cleanText(value: string): string {
  return value
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(ZERO_WIDTH_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escapes RegExp metacharacters so user input is always matched literally. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const byteLength = (value: string): number => Buffer.byteLength(value, 'utf8');
