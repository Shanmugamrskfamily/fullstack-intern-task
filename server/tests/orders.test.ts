import { describe, expect, it } from 'vitest';
import { OrderModel } from '../src/modules/orders/order.model.js';
import { TemplateModel } from '../src/modules/templates/template.model.js';
import { MISSING_ID, api, authHeader, registerUser } from './helpers.js';

const idOf = async (slug: string) =>
  String((await TemplateModel.findOne({ slug }).select('_id').lean())!._id);

describe('POST /api/orders/:templateId (demo checkout)', () => {
  it('requires a signed-in user', async () => {
    const res = await api().post(`/api/orders/${await idOf('folio-studio')}`);
    expect(res.status).toBe(401);
  });

  it('creates an order with the server-side price and 18% GST', async () => {
    const { token } = await registerUser();
    const res = await api()
      .post(`/api/orders/${await idOf('pulse-analytics')}`)
      .set(authHeader(token));

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Added to your library');
    expect(res.body.data).toMatchObject({
      payment: 'demo',
      price_inr: 2499,
      discount_inr: 1500,
      gst_inr: 450,
      total_inr: 2949,
      template: { slug: 'pulse-analytics', price_inr: 2499, is_free: false },
    });
    expect(res.body.data.order_number).toMatch(/^LY-[A-F0-9]{8}$/);
  });

  it('claims free templates at a total of 0', async () => {
    const { token } = await registerUser();
    const res = await api()
      .post(`/api/orders/${await idOf('launchpad-waitlist')}`)
      .set(authHeader(token));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      price_inr: 0,
      discount_inr: 0,
      gst_inr: 0,
      total_inr: 0,
    });
  });

  it('is idempotent: buying again returns the same order with 200', async () => {
    const { token } = await registerUser();
    const id = await idOf('folio-studio');
    const first = await api().post(`/api/orders/${id}`).set(authHeader(token));
    const again = await api().post(`/api/orders/${id}`).set(authHeader(token));

    expect(first.status).toBe(201);
    expect(again.status).toBe(200);
    expect(again.body.message).toBe('Already in your library');
    expect(again.body.data.order_number).toBe(first.body.data.order_number);
    expect(await OrderModel.countDocuments({ template: id })).toBe(1);
  });

  it('creates one order even when two purchases race', async () => {
    const { token } = await registerUser();
    const id = await idOf('cartly-storefront');
    const results = await Promise.all([
      api().post(`/api/orders/${id}`).set(authHeader(token)),
      api().post(`/api/orders/${id}`).set(authHeader(token)),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 201]);
    expect(await OrderModel.countDocuments({ template: id })).toBe(1);
  });

  it('ignores nothing silently: a client-sent price is rejected', async () => {
    const { token } = await registerUser();
    const res = await api()
      .post(`/api/orders/${await idOf('orbit-crm-admin')}`)
      .set(authHeader(token))
      .send({ price_inr: 1, total_inr: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(await OrderModel.countDocuments({})).toBe(0);
  });

  it('returns 400 for a malformed id and 404 for an unknown template', async () => {
    const { token } = await registerUser();
    const bad = await api().post('/api/orders/not-an-id').set(authHeader(token));
    const missing = await api().post(`/api/orders/${MISSING_ID}`).set(authHeader(token));
    expect(bad.status).toBe(400);
    expect(missing.status).toBe(404);
  });
});

describe('GET /api/orders (my library)', () => {
  it('requires a signed-in user', async () => {
    expect((await api().get('/api/orders')).status).toBe(401);
  });

  it("lists only the user's own orders, newest first", async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    await api()
      .post(`/api/orders/${await idOf('folio-studio')}`)
      .set(authHeader(alice.token));
    await api()
      .post(`/api/orders/${await idOf('lens-photography')}`)
      .set(authHeader(alice.token));
    await api()
      .post(`/api/orders/${await idOf('wayfare-travel')}`)
      .set(authHeader(bob.token));

    const res = await api().get('/api/orders').set(authHeader(alice.token));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.map((o: { template: { slug: string } }) => o.template.slug)).toEqual([
      'lens-photography',
      'folio-studio',
    ]);
  });
});
