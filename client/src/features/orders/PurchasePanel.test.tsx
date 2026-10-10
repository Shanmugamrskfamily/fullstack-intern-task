import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeAuth, renderWithProviders } from '@/test/render';
import type { Order, Template } from '@/types/api';
import { ordersApi } from './api';
import { PurchasePanel } from './PurchasePanel';

const paid: Template = {
  id: '6ac995a872350e709d29007e',
  name: 'Pulse Analytics',
  slug: 'pulse-analytics',
  description: 'Real-time analytics dashboard.',
  thumbnail_url: 'https://api.example.com/static/thumbnails/pulse-analytics.svg',
  category: 'Dashboard',
  category_slug: 'dashboard',
  features: [],
  pages: [],
  favorites_count: 0,
  price_inr: 2499,
  original_price_inr: 3999,
  discount_percent: 38,
  is_free: false,
  created_at: '2026-10-06T09:00:00.000Z',
};
const free: Template = {
  ...paid,
  id: '6ac995a872350e709d29007f',
  price_inr: 0,
  original_price_inr: null,
  discount_percent: 0,
  is_free: true,
};

const orderFor = (template: Template): Order => ({
  id: '6706b1f4c2a8e93d5f1a7d31',
  order_number: 'LY-9F3A2C1B',
  payment: 'demo',
  price_inr: template.price_inr,
  discount_inr: (template.original_price_inr ?? template.price_inr) - template.price_inr,
  gst_inr: Math.round(template.price_inr * 0.18),
  total_inr: template.price_inr + Math.round(template.price_inr * 0.18),
  purchased_at: '2026-10-10T09:00:00.000Z',
  template,
});

/** A tiny fake server: purchases show up in the library list, like the real API. */
function fakeOrdersServer(initial: Order[] = []) {
  let orders = initial;
  vi.spyOn(ordersApi, 'list').mockImplementation(async () => orders);
  return vi.spyOn(ordersApi, 'purchase').mockImplementation(async (id) => {
    const template = id === paid.id ? paid : free;
    const order = orderFor(template);
    orders = [order, ...orders];
    return { order, created: true };
  });
}

const signedIn = { auth: fakeAuth({ isAuthenticated: true }), path: '/templates/:id' };

describe('PurchasePanel (demo checkout)', () => {
  it('sends guests to sign in and back, without buying anything', async () => {
    const purchase = vi.spyOn(ordersApi, 'purchase');
    const { router } = renderWithProviders(<PurchasePanel template={paid} />, {
      path: '/templates/:id',
      initialEntry: `/templates/${paid.id}?q=pulse`,
      routes: [{ path: '/login', element: <p>Login page</p> }],
    });

    await userEvent.click(screen.getByRole('button', { name: /Buy for ₹2,499/ }));

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(new URLSearchParams(router.state.location.search).get('next')).toBe(
      `/templates/${paid.id}?q=pulse`,
    );
    expect(purchase).not.toHaveBeenCalled();
  });

  it('shows the launch offer: list price, saving and 18% GST on the offer price', async () => {
    const purchase = fakeOrdersServer();
    renderWithProviders(<PurchasePanel template={paid} />, {
      ...signedIn,
      initialEntry: `/templates/${paid.id}`,
    });

    await userEvent.click(await screen.findByRole('button', { name: /Buy for ₹2,499/ }));
    expect(screen.getByText('−₹1,500')).toBeInTheDocument();
    expect(screen.getByText('₹450')).toBeInTheDocument();
    expect(screen.getByText(/You save ₹1,500 on this order/)).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: /Confirm order · ₹2,949/ });
    expect(confirm).toHaveFocus();
    expect(purchase).not.toHaveBeenCalled();

    await userEvent.click(confirm);

    expect(await screen.findByText('In your library')).toBeInTheDocument();
    expect(screen.getByText('LY-9F3A2C1B')).toBeInTheDocument();
    expect(purchase).toHaveBeenCalledWith(paid.id);
  });

  it('lets the buyer cancel the summary', async () => {
    const purchase = fakeOrdersServer();
    renderWithProviders(<PurchasePanel template={paid} />, {
      ...signedIn,
      initialEntry: `/templates/${paid.id}`,
    });

    await userEvent.click(await screen.findByRole('button', { name: /Buy for ₹2,499/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: /Buy for ₹2,499/ })).toHaveFocus();
    expect(purchase).not.toHaveBeenCalled();
  });

  it('claims a free template in one tap', async () => {
    const purchase = fakeOrdersServer();
    renderWithProviders(<PurchasePanel template={free} />, {
      ...signedIn,
      initialEntry: `/templates/${free.id}`,
    });

    await userEvent.click(await screen.findByRole('button', { name: /Get it free/ }));

    expect(await screen.findByText('In your library')).toBeInTheDocument();
    expect(purchase).toHaveBeenCalledWith(free.id);
  });

  it('shows templates the user already owns as owned', async () => {
    fakeOrdersServer([orderFor(paid)]);
    renderWithProviders(<PurchasePanel template={paid} />, {
      ...signedIn,
      initialEntry: `/templates/${paid.id}`,
    });

    expect(await screen.findByText('In your library')).toBeInTheDocument();
    expect(screen.getByText(/₹2,949 paid/)).toBeInTheDocument();
    expect(screen.getByText(/You saved ₹1,500/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Buy for/ })).not.toBeInTheDocument();
  });
});
