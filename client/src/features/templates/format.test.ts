import { describe, expect, it } from 'vitest';
import { priceBreakdown } from '@/features/orders/pricing';
import { formatInr, formatPrice, formatSaves } from './format';

describe('price formatting', () => {
  it('formats rupees with Indian digit grouping and no paise', () => {
    expect(formatInr(1499)).toBe('₹1,499');
    expect(formatInr(100000)).toBe('₹1,00,000');
  });

  it('shows Free for zero', () => {
    expect(formatPrice(0)).toBe('Free');
    expect(formatPrice(799)).toBe('₹799');
  });

  it('shows the launch-offer saving and charges GST on the discounted price', () => {
    expect(priceBreakdown(2499, 3999)).toEqual({
      list: 3999,
      discount: 1500,
      price: 2499,
      gst: 450,
      total: 2949,
    });
    // A list price at or below the price is not an offer.
    expect(priceBreakdown(999, 999).discount).toBe(0);
  });

  it('adds 18% GST rounded to the rupee, like the server', () => {
    expect(priceBreakdown(2499)).toEqual({
      list: 2499,
      discount: 0,
      price: 2499,
      gst: 450,
      total: 2949,
    });
    expect(priceBreakdown(0)).toEqual({ list: 0, discount: 0, price: 0, gst: 0, total: 0 });
  });
});

describe('formatSaves', () => {
  it('invites the first save and pluralises the rest', () => {
    expect(formatSaves(0)).toBe('Be the first to save');
    expect(formatSaves(1)).toBe('1 save');
    expect(formatSaves(482)).toBe('482 saves');
  });
});
