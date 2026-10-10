/**
 * Polite screen-reader announcements for changes that have no visible focus target
 * (theme switched, result count updated). Uses one shared visually hidden live region.
 */
let region: HTMLElement | null = null;

function getRegion(): HTMLElement {
  if (region && document.body.contains(region)) return region;
  region = document.createElement('div');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  document.body.appendChild(region);
  return region;
}

export function announce(message: string): void {
  const target = getRegion();
  target.textContent = '';
  // A tick later, so repeated identical messages are still announced.
  window.setTimeout(() => {
    target.textContent = message;
  }, 50);
}
