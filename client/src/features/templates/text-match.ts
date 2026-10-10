export interface TextPart {
  text: string;
  match: boolean;
}

/**
 * Splits `text` around case-insensitive matches of `query`, mirroring the server search
 * (one literal phrase). Pure string work: the result is rendered as text, never as HTML.
 */
export function splitMatches(text: string, query: string | undefined): TextPart[] {
  const needle = query?.trim().toLowerCase();
  const haystack = text.toLowerCase();
  // Some characters change length when lowercased; then indexes would not line up.
  if (!needle || haystack.length !== text.length) return [{ text, match: false }];

  const parts: TextPart[] = [];
  let from = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + needle.length), match: true });
    from = at + needle.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
}
