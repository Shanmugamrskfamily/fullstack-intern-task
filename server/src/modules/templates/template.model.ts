import { type HydratedDocument, Schema, model } from 'mongoose';
import { CATEGORY_LABELS, type CategoryLabel } from './categories.js';

/**
 * Field names follow the task brief exactly (`thumbnail_url`), and the rest of the API
 * uses the same snake_case convention for consistency.
 */
export interface Template {
  name: string;
  slug: string;
  description: string;
  /** A server path (`/static/...`) or an absolute URL; serialised as an absolute URL. */
  thumbnail_url: string;
  category: CategoryLabel;
  features: string[];
  pages: string[];
  favorites_count: number;
  /** Price in Indian rupees, GST excluded. 0 means free. */
  price_inr: number;
  created_at: Date;
  updated_at: Date;
}

const templateSchema = new Schema<Template>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, match: /^[a-z0-9-]+$/ },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    thumbnail_url: { type: String, required: true, trim: true, maxlength: 300 },
    category: { type: String, required: true, enum: CATEGORY_LABELS, index: true },
    features: { type: [String], default: [] },
    pages: { type: [String], default: [] },
    favorites_count: { type: Number, default: 0, min: 0 },
    price_inr: { type: Number, default: 0, min: 0, max: 100_000 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// Supports the "Most popular" and "Newest" sorts.
templateSchema.index({ favorites_count: -1, name: 1 });
templateSchema.index({ created_at: -1 });
templateSchema.index({ price_inr: 1, name: 1 });

export type TemplateDocument = HydratedDocument<Template>;

export const TemplateModel = model<Template>('Template', templateSchema);
