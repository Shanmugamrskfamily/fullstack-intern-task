import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { add, favoriteParamsSchema, list, remove } from './favorite.controller.js';

export const favoriteRouter = Router();

// Every favorites route requires a signed-in user.
favoriteRouter.use(authenticate);

favoriteRouter.get('/', list);
favoriteRouter.post('/:templateId', validate({ params: favoriteParamsSchema }), add);
favoriteRouter.delete('/:templateId', validate({ params: favoriteParamsSchema }), remove);
