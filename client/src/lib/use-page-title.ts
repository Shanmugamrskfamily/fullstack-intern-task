import { useEffect } from 'react';

/**
 * Sets a descriptive document title (screen readers announce it) and restores the
 * previous one on unmount, so closing a dialog brings back the page's title.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Layora`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
