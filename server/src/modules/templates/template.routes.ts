import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { categories, getOne, list } from './template.controller.js';
import { listTemplatesQuerySchema, templateIdParamsSchema } from './template.schemas.js';

export const templateRouter = Router();

templateRouter.get('/', validate({ query: listTemplatesQuerySchema }), list);
// Declared before `/:id` so "categories" is never treated as an id.
templateRouter.get('/categories', categories);
templateRouter.get('/:id', validate({ params: templateIdParamsSchema }), getOne);
