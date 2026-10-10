/** GST on digital goods in India. The server applies the same rate and is the source of truth. */
export const GST_RATE = 0.18;

/**
 * Preview of the order shown before checkout: list price, launch-offer saving, GST on the
 * discounted price and the total. Mirrors the server, which computes the real order.
 */
export function priceBreakdown(priceInr: number, originalPriceInr: number | null = null) {
  const list = originalPriceInr && originalPriceInr > priceInr ? originalPriceInr : priceInr;
  const gst = Math.round(priceInr * GST_RATE);
  return { list, discount: list - priceInr, price: priceInr, gst, total: priceInr + gst };
}
