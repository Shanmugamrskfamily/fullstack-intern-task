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
  created_at: string;
}

export interface FavoriteTemplate extends Template {
  favorited_at: string;
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

export type SortOption = 'popular' | 'newest' | 'name';
