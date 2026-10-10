import { describe, expect, it } from 'vitest';
import { api } from './helpers.js';

interface Row {
  slug: string;
  price_inr: number;
  original_price_inr: number | null;
  discount_percent: number;
  is_free: boolean;
}

const list = async (query: string) => {
  const res = await api().get(`/api/templates?${query}`);
  return { res, data: res.body.data as Row[] };
};

describe('template pricing', () => {
  it('returns an INR price and an is_free flag on every template', async () => {
    const { data } = await list('limit=50');
    expect(data).toHaveLength(16);
    for (const t of data) {
      expect(Number.isInteger(t.price_inr)).toBe(true);
      expect(t.is_free).toBe(t.price_inr === 0);
    }
    expect(data.filter((t) => t.is_free)).toHaveLength(4);
  });

  it('filters free and paid templates', async () => {
    const free = await list('price=free');
    const paid = await list('price=paid');
    expect(free.data.every((t) => t.price_inr === 0)).toBe(true);
    expect(paid.data.every((t) => t.price_inr > 0)).toBe(true);
    expect(free.data.length + paid.data.length).toBe(16);
  });

  it('combines the price filter with a category', async () => {
    const { data } = await list('price=free&category=blog');
    expect(data.map((t) => t.slug).sort()).toEqual(['inkwell-journal', 'signal-newsletter']);
  });

  it('sorts by price in both directions', async () => {
    const asc = (await list('sort=price_asc')).data.map((t) => t.price_inr);
    const desc = (await list('sort=price_desc')).data.map((t) => t.price_inr);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(desc[0]).toBe(2999);
  });

  it('shows launch offers only where the list price is really higher', async () => {
    const { data } = await list('limit=50');
    const onOffer = data.filter((t) => t.original_price_inr !== null);

    expect(onOffer.length).toBeGreaterThan(0);
    for (const t of data) {
      if (t.original_price_inr === null) {
        expect(t.discount_percent).toBe(0);
        continue;
      }
      expect(t.original_price_inr).toBeGreaterThan(t.price_inr);
      expect(t.discount_percent).toBe(Math.round((1 - t.price_inr / t.original_price_inr) * 100));
    }
    // The store banner promises "up to 40% off": keep the data honest.
    expect(Math.max(...data.map((t) => t.discount_percent))).toBe(40);
    expect(data.filter((t) => t.is_free).every((t) => t.original_price_inr === null)).toBe(true);
  });

  it('rejects unknown price filters and injection attempts', async () => {
    expect((await list('price=cheap')).res.status).toBe(400);
    expect((await list('price[$gt]=0')).res.status).toBe(400);
  });
});
