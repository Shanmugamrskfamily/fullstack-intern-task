import { http } from '@/lib/http';
import type { ApiSuccess, Order } from '@/types/api';

export const ordersApi = {
  async list(signal?: AbortSignal): Promise<Order[]> {
    return (await http.get<ApiSuccess<Order[]>>('/orders', { signal })).data.data;
  },

  /** Demo checkout. No body is sent: the server decides the price, GST and total. */
  async purchase(templateId: string): Promise<{ order: Order; created: boolean }> {
    const response = await http.post<ApiSuccess<Order>>(
      `/orders/${encodeURIComponent(templateId)}`,
    );
    return { order: response.data.data, created: response.status === 201 };
  },
};
