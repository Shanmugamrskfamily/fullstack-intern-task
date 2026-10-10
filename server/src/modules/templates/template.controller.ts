import type { RequestHandler } from 'express';
import { validated } from '../../middlewares/validate.js';
import { listTemplatesQuerySchema, templateIdParamsSchema } from './template.schemas.js';
import { getTemplateById, listCategories, listTemplates } from './template.service.js';

const PUBLIC_CACHE = 'public, max-age=30, stale-while-revalidate=120';

export const list: RequestHandler = async (req, res) => {
  const { items, meta } = await listTemplates(validated(req, 'query', listTemplatesQuerySchema));
  res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: items, meta });
};

export const categories: RequestHandler = async (_req, res) => {
  res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: await listCategories() });
};

export const getOne: RequestHandler = async (req, res) => {
  const { id } = validated(req, 'params', templateIdParamsSchema);
  res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: await getTemplateById(id) });
};
