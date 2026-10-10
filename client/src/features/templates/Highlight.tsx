import { splitMatches } from './text-match';

/** Marks the parts of `text` that match the active search. */
export function Highlight({ text, query }: { text: string; query?: string }) {
  const parts = splitMatches(text, query);
  if (parts.length === 1 && !parts[0]!.match) return text;

  return parts.map((part, index) =>
    part.match ? (
      <mark
        key={index}
        // A matching box-shadow widens the tint without adding space inside the word.
        className="rounded-[3px] bg-primary-soft font-bold text-primary-text shadow-[0_0_0_2px_var(--primary-soft)] [box-decoration-break:clone]"
      >
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}
