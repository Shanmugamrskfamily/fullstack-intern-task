import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/auth-context';
import { ApiError, getErrorMessage } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import type { Order, Template } from '@/types/api';
import { ordersApi } from './api';

export function useOrders() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => ordersApi.list(signal),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

const toOwnedMap = (orders: Order[]) => new Map(orders.map((order) => [order.template.id, order]));
const EMPTY = new Map<string, Order>();

/** Orders of the signed-in user keyed by template id, for "Owned" badges and buttons. */
export function useOwnedTemplates(): Map<string, Order> {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => ordersApi.list(signal),
    enabled: isAuthenticated,
    staleTime: 30_000,
    select: toOwnedMap,
  });
  return isAuthenticated && data ? data : EMPTY;
}

/** Demo checkout. One purchase per template at a time; the server is idempotent too. */
export function usePurchase(template: Template) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  return useMutation({
    mutationKey: ['purchase', template.id],
    scope: { id: `purchase:${template.id}` },
    mutationFn: () => ordersApi.purchase(template.id),

    onSuccess: ({ order, created }) => {
      queryClient.setQueryData<Order[]>(queryKeys.orders, (list = []) => [
        order,
        ...list.filter((item) => item.id !== order.id),
      ]);
      toast.success(created ? 'Added to your library' : 'Already in your library', {
        description: `“${template.name}” · Order ${order.order_number}`,
        action: location.pathname.startsWith('/library')
          ? undefined
          : { label: 'View', onClick: () => navigate('/library') },
      });
    },

    onError: (error) => {
      // 401s are handled globally (session expired toast + sign-in prompt).
      if (error instanceof ApiError && error.status === 401) return;
      toast.error("Couldn't complete the checkout", { description: getErrorMessage(error) });
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
  });
}
