export const formatSaves = (count: number) =>
  count === 0 ? 'Be the first to save' : `${count} ${count === 1 ? 'save' : 'saves'}`;

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Indian rupees with Indian digit grouping: ₹1,499 · ₹1,00,000. */
export const formatInr = (amount: number) => inr.format(amount);

export const formatPrice = (amount: number) => (amount === 0 ? 'Free' : formatInr(amount));

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Sample popularity at or above this many saves earns a Bestseller badge. */
export const BESTSELLER_SAVES = 400;

export const isBestseller = (template: { favorites_count: number }) =>
  template.favorites_count >= BESTSELLER_SAVES;

export const formatMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

/** Responsive card grid: 1 column on phones up to 4 on wide screens. */
export const gridClassName =
  'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-7';
