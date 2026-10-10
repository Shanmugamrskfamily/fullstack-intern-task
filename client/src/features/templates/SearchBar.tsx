import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input, InputShell } from '@/components/ui/input';
import { cleanText } from '@/lib/security';
import { cn } from '@/lib/utils';

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  /** Enables the global "/" shortcut. */
  shortcut?: boolean;
  debounceMs?: number;
}

/** Debounced search field. Typing updates the input instantly; the URL and query follow 300 ms later. */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search templates by name or description…',
  label = 'Search templates',
  className,
  shortcut = true,
  debounceMs = 300,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);

  // The URL changed from outside (back button, "Clear filters"): follow it.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    const cleaned = cleanText(draft, 64);
    if (cleaned === value) return;
    const timer = window.setTimeout(() => onChange(cleaned), debounceMs);
    return () => window.clearTimeout(timer);
  }, [draft, value, onChange, debounceMs]);

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== '/' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTyping(event.target)
      )
        return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcut]);

  return (
    <div role="search" className={className}>
      <label htmlFor="template-search" className="sr-only">
        {label}
      </label>
      <InputShell
        className="h-[60px] rounded-[18px] pr-2.5 pl-5"
        leading={<Search className="size-[21px] shrink-0" aria-hidden="true" />}
        trailing={
          draft ? (
            <button
              type="button"
              onClick={() => {
                setDraft('');
                onChange('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="grid size-10 shrink-0 place-items-center rounded-xl text-subtle transition hover:bg-surface hover:text-foreground active:scale-90"
            >
              <X className="size-[18px]" aria-hidden="true" />
            </button>
          ) : (
            shortcut && (
              <kbd
                aria-hidden="true"
                className="soft-raised-sm hidden h-[30px] min-w-[30px] place-items-center rounded-[9px] px-2 font-sans text-[12px] font-bold text-muted-foreground md:grid"
              >
                /
              </kbd>
            )
          )
        }
      >
        <Input
          ref={inputRef}
          id="template-search"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          maxLength={64}
          placeholder={placeholder}
          aria-keyshortcuts={shortcut ? '/' : undefined}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && draft) {
              event.preventDefault();
              setDraft('');
              onChange('');
            }
          }}
          className={cn('text-[15.5px]')}
        />
      </InputShell>
    </div>
  );
}
