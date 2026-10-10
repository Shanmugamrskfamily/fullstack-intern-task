import { z } from 'zod';
import { objectIdSchema } from '../../utils/mongo.js';
import { cleanText } from '../../utils/text.js';
import { CATEGORIES, findCategory } from './categories.js';

export const SORT_OPTIONS = ['popular', 'newest', 'name', 'price_asc', 'price_desc'] as const;
export const PRICE_FILTERS = ['free', 'paid'] as const;

/** An empty query value (`?search=`) means "not provided". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const listTemplatesQuerySchema = z.strictObject({
  search: optional(
    z
      .string('Search must be a single value')
      .transform(cleanText)
      .pipe(z.string().max(64, 'Search can be at most 64 characters')),
  ),
  category: optional(
    z
      .string('Category must be a single value')
      .refine((value) => Boolean(findCategory(value)), {
        message: `Unknown category. Use one of: ${CATEGORIES.map((c) => c.slug).join(', ')}`,
      })
      .transform((value) => findCategory(value)!.label),
  ),
  price: optional(z.enum(PRICE_FILTERS, `Price must be one of: ${PRICE_FILTERS.join(', ')}`)),
  sort: optional(z.enum(SORT_OPTIONS, `Sort must be one of: ${SORT_OPTIONS.join(', ')}`)).default(
    'popular',
  ),
  page: optional(z.coerce.number().int().min(1).max(1000)).default(1),
  limit: optional(z.coerce.number().int().min(1).max(50)).default(50),
});

export const templateIdParamsSchema = z.strictObject({ id: objectIdSchema('template id') });

export type ListTemplatesQuery = z.output<typeof listTemplatesQuerySchema>;
