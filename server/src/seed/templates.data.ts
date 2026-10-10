import type { CategoryLabel } from '../modules/templates/categories.js';

export type ThumbnailKind =
  'landing' | 'pricing' | 'dashboard' | 'crm' | 'ecommerce' | 'portfolio' | 'blog' | 'mobile';

export interface SeedTemplate {
  slug: string;
  name: string;
  category: CategoryLabel;
  description: string;
  features: string[];
  pages: string[];
  /** Used for the "Newest" sort, so the seed data has a realistic order. */
  added: string;
  /**
   * Sample popularity for the demo catalogue (shown as "N saves" and used by the
   * "Most popular" sort). Real favorites are added on top; see syncFavoriteCounts().
   * Two templates start at 0 so the "Be the first to save" state is visible.
   */
  sampleSaves: number;
  /** Price in Indian rupees (whole rupees, GST excluded). 0 means free. */
  priceInr: number;
  /** Launch offer: the list price before the discount. Omitted when there is no offer. */
  originalPriceInr?: number;
  /** Drives the generated SVG thumbnail. */
  art: { kind: ThumbnailKind; accent: string; backdrop: [string, string] };
}

export const thumbnailPath = (slug: string) => `/static/thumbnails/${slug}.svg`;

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    slug: 'nimbus-saas-landing',
    name: 'Nimbus SaaS Landing',
    category: 'Landing Page',
    description:
      'Conversion-focused SaaS landing page with a bold hero, feature grid, pricing table and customer testimonials.',
    features: [
      'Hero with product mockup and two calls to action',
      'Feature grid with icon cards',
      'Three-tier pricing table',
      'Testimonials and logo cloud',
    ],
    pages: ['Home', 'Features', 'Pricing', 'Blog', 'Contact'],
    added: '2026-10-08',
    sampleSaves: 482,
    priceInr: 1499,
    originalPriceInr: 2499,
    art: { kind: 'landing', accent: '#4F46E5', backdrop: ['#C7D2FE', '#EEF2FF'] },
  },
  {
    slug: 'launchpad-waitlist',
    name: 'Launchpad Waitlist',
    category: 'Landing Page',
    description:
      'Pre-launch page with pricing tiers, waitlist email capture and social-proof sections.',
    features: [
      'Waitlist email capture with success state',
      'Launch countdown',
      'Pricing tiers preview',
      'FAQ accordion',
    ],
    pages: ['Waitlist', 'Pricing', 'FAQ', 'Thank you'],
    added: '2026-09-30',
    sampleSaves: 264,
    priceInr: 0,
    art: { kind: 'pricing', accent: '#2563EB', backdrop: ['#BFDBFE', '#EFF6FF'] },
  },
  {
    slug: 'beacon-product-launch',
    name: 'Beacon Product Launch',
    category: 'Landing Page',
    description:
      'Product launch page with a story-led hero, changelog highlights and an embedded demo video section.',
    features: [
      'Story-led hero section',
      'Changelog highlights',
      'Demo video section',
      'Newsletter sign-up',
    ],
    pages: ['Launch', 'Changelog', 'Demo', 'Press kit'],
    added: '2026-09-18',
    sampleSaves: 143,
    priceInr: 999,
    originalPriceInr: 1499,
    art: { kind: 'landing', accent: '#DB2777', backdrop: ['#FBCFE8', '#FDF2F8'] },
  },
  {
    slug: 'pulse-analytics',
    name: 'Pulse Analytics',
    category: 'Dashboard',
    description:
      'Real-time analytics dashboard with KPI cards, trend charts and a filterable activity table.',
    features: [
      'KPI cards with sparklines',
      'Trend charts with date ranges',
      'Filterable activity table',
      'Light and dark themes',
    ],
    pages: ['Overview', 'Reports', 'Customers', 'Settings', 'Login'],
    added: '2026-10-06',
    sampleSaves: 0,
    priceInr: 2499,
    originalPriceInr: 3999,
    art: { kind: 'dashboard', accent: '#0D9488', backdrop: ['#99F6E4', '#F0FDFA'] },
  },
  {
    slug: 'ledger-finance',
    name: 'Ledger Finance',
    category: 'Dashboard',
    description: 'Personal finance dashboard with budgets, transactions and spending insights.',
    features: [
      'Budget progress tracking',
      'Categorised transaction list',
      'Monthly spending insights',
      'CSV export screen',
    ],
    pages: ['Overview', 'Transactions', 'Budgets', 'Insights', 'Settings'],
    added: '2026-09-22',
    sampleSaves: 351,
    priceInr: 1999,
    art: { kind: 'dashboard', accent: '#059669', backdrop: ['#A7F3D0', '#ECFDF5'] },
  },
  {
    slug: 'orbit-crm-admin',
    name: 'Orbit CRM Admin',
    category: 'Dashboard',
    description:
      'CRM admin panel with a lead pipeline, contact table, role-based settings and an activity timeline.',
    features: [
      'Lead pipeline board',
      'Sortable contact table',
      'Role-based settings',
      'Activity timeline',
    ],
    pages: ['Pipeline', 'Contacts', 'Deals', 'Team', 'Settings'],
    added: '2026-09-12',
    sampleSaves: 298,
    priceInr: 2999,
    originalPriceInr: 4999,
    art: { kind: 'crm', accent: '#9333EA', backdrop: ['#E9D5FF', '#FAF5FF'] },
  },
  {
    slug: 'cartly-storefront',
    name: 'Cartly Storefront',
    category: 'E-commerce',
    description: 'Modern storefront with a product grid, quick-view modal and a slide-over cart.',
    features: [
      'Product grid with filters',
      'Quick-view modal',
      'Slide-over cart',
      'Three-step checkout',
    ],
    pages: ['Shop', 'Product', 'Cart', 'Checkout', 'Account'],
    added: '2026-10-04',
    sampleSaves: 436,
    priceInr: 1799,
    originalPriceInr: 2999,
    art: { kind: 'ecommerce', accent: '#D97706', backdrop: ['#FDE68A', '#FFFBEB'] },
  },
  {
    slug: 'atelier-lookbook',
    name: 'Atelier Lookbook',
    category: 'E-commerce',
    description:
      'Fashion lookbook store with editorial product stories, a size guide and a wishlist.',
    features: ['Editorial lookbook sections', 'Size guide drawer', 'Wishlist', 'Shoppable gallery'],
    pages: ['Lookbook', 'Collection', 'Product', 'Wishlist', 'Checkout'],
    added: '2026-09-25',
    sampleSaves: 329,
    priceInr: 1299,
    art: { kind: 'portfolio', accent: '#EA580C', backdrop: ['#FED7AA', '#FFF7ED'] },
  },
  {
    slug: 'pantry-grocery',
    name: 'Pantry Grocery',
    category: 'E-commerce',
    description:
      'Grocery delivery storefront with category aisles, delivery slots and a quick reorder list.',
    features: ['Category aisles', 'Delivery slot picker', 'Quick reorder list', 'Promo banners'],
    pages: ['Home', 'Aisle', 'Product', 'Basket', 'Delivery'],
    added: '2026-09-08',
    sampleSaves: 221,
    priceInr: 1499,
    originalPriceInr: 1999,
    art: { kind: 'ecommerce', accent: '#16A34A', backdrop: ['#BBF7D0', '#F0FDF4'] },
  },
  {
    slug: 'folio-studio',
    name: 'Folio Studio',
    category: 'Portfolio',
    description: 'Minimal portfolio for designers with case-study pages and a masonry gallery.',
    features: [
      'Masonry project gallery',
      'Long-form case studies',
      'About and services sections',
      'Contact form',
    ],
    pages: ['Home', 'Work', 'Case study', 'About', 'Contact'],
    added: '2026-10-02',
    sampleSaves: 412,
    priceInr: 799,
    originalPriceInr: 1299,
    art: { kind: 'portfolio', accent: '#E11D48', backdrop: ['#FECDD3', '#FFF1F2'] },
  },
  {
    slug: 'lens-photography',
    name: 'Lens Photography',
    category: 'Portfolio',
    description:
      'Photography portfolio with full-bleed galleries, client proofing and a booking page.',
    features: ['Full-bleed galleries', 'Client proofing area', 'Booking page', 'Lightbox viewer'],
    pages: ['Home', 'Galleries', 'Proofing', 'Booking', 'About'],
    added: '2026-09-15',
    sampleSaves: 168,
    priceInr: 699,
    originalPriceInr: 999,
    art: { kind: 'portfolio', accent: '#0891B2', backdrop: ['#A5F3FC', '#ECFEFF'] },
  },
  {
    slug: 'inkwell-journal',
    name: 'Inkwell Journal',
    category: 'Blog',
    description:
      'Editorial blog layout with featured stories, tag filters and reading-time estimates.',
    features: ['Featured story hero', 'Tag filters', 'Reading-time estimates', 'Author pages'],
    pages: ['Home', 'Article', 'Tags', 'Author', 'Newsletter'],
    added: '2026-09-28',
    sampleSaves: 187,
    priceInr: 0,
    art: { kind: 'blog', accent: '#7C3AED', backdrop: ['#DDD6FE', '#F5F3FF'] },
  },
  {
    slug: 'signal-newsletter',
    name: 'Signal Newsletter',
    category: 'Blog',
    description:
      'Newsletter-first blog with an issue archive, subscriber sign-up and sponsor slots.',
    features: ['Issue archive', 'Subscriber sign-up', 'Sponsor slots', 'RSS-ready articles'],
    pages: ['Home', 'Archive', 'Issue', 'Subscribe', 'Sponsors'],
    added: '2026-09-05',
    sampleSaves: 119,
    priceInr: 0,
    art: { kind: 'blog', accent: '#CA8A04', backdrop: ['#FEF08A', '#FEFCE8'] },
  },
  {
    slug: 'velvet-mobile-kit',
    name: 'Velvet Mobile Kit',
    category: 'Mobile App',
    description: 'Mobile app screens for onboarding, profile, wallet and in-app purchases.',
    features: [
      'Onboarding carousel',
      'Profile and settings',
      'Wallet and cards',
      'Paywall screens',
    ],
    pages: ['Onboarding', 'Home', 'Wallet', 'Profile', 'Paywall'],
    added: '2026-10-07',
    sampleSaves: 0,
    priceInr: 0,
    art: { kind: 'mobile', accent: '#0284C7', backdrop: ['#BAE6FD', '#F0F9FF'] },
  },
  {
    slug: 'stride-fitness',
    name: 'Stride Fitness',
    category: 'Mobile App',
    description: 'Fitness tracking app with workout plans, progress charts and streak rewards.',
    features: ['Workout plans', 'Progress charts', 'Streak rewards', 'Wearable sync screens'],
    pages: ['Today', 'Workouts', 'Progress', 'Rewards', 'Profile'],
    added: '2026-09-20',
    sampleSaves: 247,
    priceInr: 1199,
    art: { kind: 'mobile', accent: '#DC2626', backdrop: ['#FECACA', '#FEF2F2'] },
  },
  {
    slug: 'wayfare-travel',
    name: 'Wayfare Travel',
    category: 'Mobile App',
    description: 'Travel planner app with trip itineraries, offline maps and shared packing lists.',
    features: ['Trip itineraries', 'Offline maps screen', 'Shared packing lists', 'Booking wallet'],
    pages: ['Trips', 'Itinerary', 'Map', 'Packing', 'Bookings'],
    added: '2026-09-02',
    sampleSaves: 305,
    priceInr: 1399,
    originalPriceInr: 2199,
    art: { kind: 'mobile', accent: '#65A30D', backdrop: ['#D9F99D', '#F7FEE7'] },
  },
];
