/** Shapes returned by the Layora API (snake_case, as served). */

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Session {
  user: User;
  token: string;
  expires_at: string;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  category: string;
  category_slug: string;
  features: string[];
  pages: string[];
  favorites_count: number;
  /** Price in rupees before GST. 0 means free. */
  price_inr: number;
  /** Launch offer: list price before the discount, or null without an offer. */
  original_price_inr: number | null;
  discount_percent: number;
  is_free: boolean;
  created_at: string;
}

export interface FavoriteTemplate extends Template {
  favorited_at: string;
}

/** A demo purchase: no payment provider, prices always computed by the server. */
export interface Order {
  id: string;
  order_number: string;
  payment: 'demo';
  price_inr: number;
  /** Launch-offer saving against the list price. */
  discount_inr: number;
  gst_inr: number;
  total_inr: number;
  purchased_at: string;
  template: Template;
}

export interface Category {
  slug: string;
  name: string;
  count: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiSuccess<T, M = undefined> {
  success: true;
  data: T;
  meta?: M;
  message?: string;
}

export type SortOption = 'popular' | 'newest' | 'name' | 'price_asc' | 'price_desc';

export type PriceFilter = 'free' | 'paid';
