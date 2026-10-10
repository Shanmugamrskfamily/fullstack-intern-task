import mongoose, { type SortOrder } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { escapeRegex } from '../../utils/text.js';
import { CATEGORIES } from './categories.js';
import { type Template, TemplateModel } from './template.model.js';
import type { ListTemplatesQuery } from './template.schemas.js';
import { type PublicTemplate, toPublicTemplate } from './template.serializer.js';

const SORTS: Record<ListTemplatesQuery['sort'], Record<string, SortOrder>> = {
  popular: { favorites_count: -1, name: 1 },
  newest: { created_at: -1, name: 1 },
  name: { name: 1 },
  price_asc: { price_inr: 1, name: 1 },
  price_desc: { price_inr: -1, name: 1 },
};

export interface TemplatePage {
  items: PublicTemplate[];
  meta: { page: number; limit: number; total: number; total_pages: number };
}

export async function listTemplates(query: ListTemplatesQuery): Promise<TemplatePage> {
  const filter: Record<string, unknown> = {};
  if (query.category) filter.category = query.category;
  if (query.price === 'free') filter.price_inr = 0;
  // `trusted()` marks our own operator, not user input (see sanitizeFilter in db.ts).
  if (query.price === 'paid') filter.price_inr = mongoose.trusted({ $gt: 0 });
  if (query.search) {
    // Escaped and length-capped by validation: matched literally, no ReDoS.
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  const { page, limit } = query;
  const [items, total] = await Promise.all([
    TemplateModel.find(filter)
      .sort(SORTS[query.sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<Array<Template & { _id: string }>>(),
    TemplateModel.countDocuments(filter),
  ]);

  return {
    items: items.map(toPublicTemplate),
    meta: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getTemplateById(id: string): Promise<PublicTemplate> {
  const template = await TemplateModel.findById(id).lean<Template & { _id: string }>();
  if (!template) throw ApiError.notFound('Template not found');
  return toPublicTemplate(template);
}

/** Every category with its template count, in the fixed taxonomy order (zero counts included). */
export async function listCategories() {
  const counts = await TemplateModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const byLabel = new Map(counts.map((c) => [c._id, c.count]));
  return CATEGORIES.map((c) => ({ slug: c.slug, name: c.label, count: byLabel.get(c.label) ?? 0 }));
}
