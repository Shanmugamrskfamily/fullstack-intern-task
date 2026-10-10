import { Schema, type Types, model } from 'mongoose';

/**
 * A demo purchase: no payment provider is involved, so no card or payment data is ever
 * received or stored. Prices are copied from the template at purchase time.
 */
export interface Order {
  user: Types.ObjectId;
  template: Types.ObjectId;
  order_number: string;
  price_inr: number;
  gst_inr: number;
  total_inr: number;
  created_at: Date;
}

const orderSchema = new Schema<Order>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    template: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    order_number: { type: String, required: true, unique: true, match: /^LY-[A-F0-9]{8}$/ },
    price_inr: { type: Number, required: true, min: 0 },
    gst_inr: { type: Number, required: true, min: 0 },
    total_inr: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false },
);

// A template can be owned once per user, enforced by the database (makes POST idempotent).
orderSchema.index({ user: 1, template: 1 }, { unique: true });
// "My library, newest first".
orderSchema.index({ user: 1, created_at: -1 });

export const OrderModel = model<Order>('Order', orderSchema);
