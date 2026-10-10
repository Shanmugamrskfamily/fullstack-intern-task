import type { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { slugForCategory } from './categories.js';
import type { Template } from './template.model.js';

export interface PublicTemplate {
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
  price_inr: number;
  is_free: boolean;
  created_at: string;
}

type TemplateLike = Template & { _id: Types.ObjectId | string };

/** Stored paths become absolute URLs so any client can render them directly. */
export const toAbsoluteUrl = (value: string): string =>
  /^https?:\/\//i.test(value)
    ? value
    : `${env.publicBaseUrl}${value.startsWith('/') ? '' : '/'}${value}`;

/** Response DTO: an explicit allowlist of fields, with `id` instead of `_id`. */
export const toPublicTemplate = (template: TemplateLike): PublicTemplate => ({
  id: String(template._id),
  name: template.name,
  slug: template.slug,
  description: template.description,
  thumbnail_url: toAbsoluteUrl(template.thumbnail_url),
  category: template.category,
  category_slug: slugForCategory(template.category),
  features: template.features ?? [],
  pages: template.pages ?? [],
  favorites_count: template.favorites_count ?? 0,
  price_inr: template.price_inr ?? 0,
  is_free: (template.price_inr ?? 0) === 0,
  created_at: new Date(template.created_at).toISOString(),
});
