/** Fixed category taxonomy. The label is stored; the slug is used in URLs. */
export const CATEGORIES = [
  { slug: 'landing-page', label: 'Landing Page' },
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'e-commerce', label: 'E-commerce' },
  { slug: 'portfolio', label: 'Portfolio' },
  { slug: 'blog', label: 'Blog' },
  { slug: 'mobile-app', label: 'Mobile App' },
] as const;

export type CategoryLabel = (typeof CATEGORIES)[number]['label'];
export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_LABELS = CATEGORIES.map((c) => c.label) as [
  CategoryLabel,
  ...CategoryLabel[],
];

/** Accepts a slug (`landing-page`) or a label (`Landing Page`), case-insensitive. */
export function findCategory(value: string) {
  const needle = value.trim().toLowerCase();
  return CATEGORIES.find((c) => c.slug === needle || c.label.toLowerCase() === needle);
}

export const slugForCategory = (label: string): string =>
  CATEGORIES.find((c) => c.label === label)?.slug ?? label.toLowerCase().replace(/\s+/g, '-');
