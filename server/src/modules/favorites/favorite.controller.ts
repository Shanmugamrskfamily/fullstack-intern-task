import type { RequestHandler } from 'express';
import { z } from 'zod';
import { validated } from '../../middlewares/validate.js';
import { objectIdSchema } from '../../utils/mongo.js';
import { addFavorite, listFavorites, removeFavorite } from './favorite.service.js';

export const favoriteParamsSchema = z.strictObject({ templateId: objectIdSchema('template id') });

const currentUserId = (req: Parameters<RequestHandler>[0]) => req.user!.id; // set by authenticate()

export const list: RequestHandler = async (req, res) => {
  const favorites = await listFavorites(currentUserId(req));
  res
    .set('Cache-Control', 'private, no-store')
    .json({ success: true, data: favorites, meta: { total: favorites.length } });
};

export const add: RequestHandler = async (req, res) => {
  const { templateId } = validated(req, 'params', favoriteParamsSchema);
  const { created, template } = await addFavorite(currentUserId(req), templateId);
  res.status(created ? 201 : 200).json({
    success: true,
    data: template,
    message: created ? 'Added to favorites' : 'Already in your favorites',
  });
};

export const remove: RequestHandler = async (req, res) => {
  const { templateId } = validated(req, 'params', favoriteParamsSchema);
  await removeFavorite(currentUserId(req), templateId);
  res.status(204).end();
};
