export const formatSaves = (count: number) =>
  count === 0 ? 'Be the first to save' : `${count} ${count === 1 ? 'save' : 'saves'}`;

export const formatMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

/** Responsive card grid: 1 column on phones up to 4 on wide screens. */
export const gridClassName =
  'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-7';
