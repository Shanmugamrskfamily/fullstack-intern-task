import { type RequestHandler, Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate, validated } from '../../middlewares/validate.js';
import { objectIdSchema } from '../../utils/mongo.js';
import { listOrders, purchaseTemplate } from './order.service.js';

export const orderParamsSchema = z.strictObject({ templateId: objectIdSchema('template id') });
/** The body must be empty: the client cannot send a price, a total or anything else. */
export const orderBodySchema = z.strictObject({});

const list: RequestHandler = async (req, res) => {
  const orders = await listOrders(req.user!.id);
  res
    .set('Cache-Control', 'private, no-store')
    .json({ success: true, data: orders, meta: { total: orders.length } });
};

const purchase: RequestHandler = async (req, res) => {
  const { templateId } = validated(req, 'params', orderParamsSchema);
  const { created, order } = await purchaseTemplate(req.user!.id, templateId);
  res.status(created ? 201 : 200).json({
    success: true,
    data: order,
    message: created ? 'Added to your library' : 'Already in your library',
  });
};

export const orderRouter = Router();

// Every order route requires a signed-in user.
orderRouter.use(authenticate);

orderRouter.get('/', list);
orderRouter.post(
  '/:templateId',
  validate({ params: orderParamsSchema, body: orderBodySchema }),
  purchase,
);
