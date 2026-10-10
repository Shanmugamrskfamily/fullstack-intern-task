import { randomBytes } from 'node:crypto';
import type { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { isDuplicateKeyError } from '../../utils/mongo.js';
import { type Template, TemplateModel } from '../templates/template.model.js';
import {
  type PublicTemplate,
  offerFor,
  toPublicTemplate,
} from '../templates/template.serializer.js';
import { type Order, OrderModel } from './order.model.js';

/** GST on digital goods in India. */
export const GST_RATE = 0.18;

export interface PublicOrder {
  id: string;
  order_number: string;
  payment: 'demo';
  price_inr: number;
  discount_inr: number;
  gst_inr: number;
  total_inr: number;
  purchased_at: string;
  template: PublicTemplate;
}

type LeanTemplate = Template & { _id: Types.ObjectId | string };
type LeanOrder = Order & { _id: Types.ObjectId | string };

/**
 * The price always comes from the database, never from the client. GST applies to the
 * discounted price; the discount is recorded so receipts can show the saving.
 */
export function priceBreakdown(priceInr: number, originalPriceInr?: number | null) {
  const { original_price_inr: original } = offerFor(priceInr, originalPriceInr);
  const gst = Math.round(priceInr * GST_RATE);
  return {
    price_inr: priceInr,
    discount_inr: original ? original - priceInr : 0,
    gst_inr: gst,
    total_inr: priceInr + gst,
  };
}

const newOrderNumber = () => `LY-${randomBytes(4).toString('hex').toUpperCase()}`;

const toPublicOrder = (order: LeanOrder, template: LeanTemplate): PublicOrder => ({
  id: String(order._id),
  order_number: order.order_number,
  payment: 'demo',
  price_inr: order.price_inr,
  discount_inr: order.discount_inr ?? 0,
  gst_inr: order.gst_inr,
  total_inr: order.total_inr,
  purchased_at: new Date(order.created_at).toISOString(),
  template: toPublicTemplate(template),
});

/**
 * Demo checkout. Idempotent: the first call creates the order (`created: true`), later
 * calls return the existing one. The unique index guarantees a single order even when
 * two requests race.
 */
export async function purchaseTemplate(userId: string, templateId: string) {
  const template = await TemplateModel.findById(templateId).lean<LeanTemplate>();
  if (!template) throw ApiError.notFound('Template not found');

  const existing = await OrderModel.findOne({
    user: userId,
    template: templateId,
  }).lean<LeanOrder>();
  if (existing) return { created: false, order: toPublicOrder(existing, template) };

  try {
    const order = await OrderModel.create({
      user: userId,
      template: templateId,
      order_number: newOrderNumber(),
      ...priceBreakdown(template.price_inr ?? 0, template.original_price_inr),
    });
    return { created: true, order: toPublicOrder(order.toObject() as LeanOrder, template) };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const raced = await OrderModel.findOne({
      user: userId,
      template: templateId,
    }).lean<LeanOrder>();
    if (!raced) throw error;
    return { created: false, order: toPublicOrder(raced, template) };
  }
}

export async function listOrders(userId: string): Promise<PublicOrder[]> {
  const orders = await OrderModel.find({ user: userId })
    .sort({ created_at: -1 })
    .populate<{ template: LeanTemplate | null }>('template')
    .lean();

  return orders
    .filter((order) => order.template !== null) // skip templates removed from the catalogue
    .map((order) => toPublicOrder(order as unknown as LeanOrder, order.template!));
}
