/** Mirrors the server taxonomy; used for URL validation and the colour dots. */
export const CATEGORIES = [
  { slug: 'landing-page', name: 'Landing Page', color: '#4F46E5' },
  { slug: 'dashboard', name: 'Dashboard', color: '#0D9488' },
  { slug: 'e-commerce', name: 'E-commerce', color: '#D97706' },
  { slug: 'portfolio', name: 'Portfolio', color: '#E11D48' },
  { slug: 'blog', name: 'Blog', color: '#7C3AED' },
  { slug: 'mobile-app', name: 'Mobile App', color: '#0284C7' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const isCategorySlug = (value: unknown): value is CategorySlug =>
  CATEGORIES.some((category) => category.slug === value);

export const categoryColor = (slug: string) =>
  CATEGORIES.find((category) => category.slug === slug)?.color ?? '#64748B';
