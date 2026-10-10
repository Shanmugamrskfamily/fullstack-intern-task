import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HeartOff } from 'lucide-react';
import { createElement, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/auth-context';
import { patchCachedTemplate } from '@/features/templates/queries';
import { ApiError, getErrorMessage } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import type { FavoriteTemplate, Template } from '@/types/api';
import { favoritesApi } from './api';

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: ({ signal }) => favoritesApi.list(signal),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

const toIdSet = (list: FavoriteTemplate[]) => new Set(list.map((template) => template.id));
const EMPTY = new Set<string>();

/** The ids of the signed-in user's favorites, for marking cards as saved. */
export function useFavoriteIds(): Set<string> {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: ({ signal }) => favoritesApi.list(signal),
    enabled: isAuthenticated,
    staleTime: 30_000,
    select: toIdSet,
  });
  return isAuthenticated && data ? data : EMPTY;
}

interface ToggleVariables {
  template: Template;
  favorite: boolean;
}

const adjustCount = (delta: number) => (template: Template) => ({
  ...template,
  favorites_count: Math.max(0, template.favorites_count + delta),
});

/**
 * Optimistic favourite toggle: the heart and counts update instantly, roll back if the
 * request fails, and an Undo toast follows every removal. Mutations for the same
 * template run one at a time (`scope`), so rapid taps can never race.
 */
export function useToggleFavorite(templateId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const mutateRef = useRef<(variables: ToggleVariables) => void>(() => undefined);

  const mutation = useMutation({
    mutationKey: ['favorite', templateId],
    scope: { id: `favorite:${templateId}` },
    mutationFn: async ({ template, favorite }: ToggleVariables) =>
      favorite ? favoritesApi.add(template.id) : favoritesApi.remove(template.id).then(() => null),

    onMutate: async ({ template, favorite }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites });
      const previous = queryClient.getQueryData<FavoriteTemplate[]>(queryKeys.favorites);
      queryClient.setQueryData<FavoriteTemplate[]>(queryKeys.favorites, (list = []) => {
        const rest = list.filter((item) => item.id !== template.id);
        return favorite
          ? [
              {
                ...template,
                favorites_count: template.favorites_count + 1,
                favorited_at: new Date().toISOString(),
              },
              ...rest,
            ]
          : rest;
      });
      patchCachedTemplate(queryClient, template.id, adjustCount(favorite ? 1 : -1));
      return { previous };
    },

    onError: (error, { template, favorite }, context) => {
      queryClient.setQueryData(queryKeys.favorites, context?.previous);
      patchCachedTemplate(queryClient, template.id, adjustCount(favorite ? -1 : 1));
      // 401s are handled globally (session expired toast + sign-in prompt).
      if (error instanceof ApiError && error.status === 401) return;
      toast.error(favorite ? "Couldn't save that template" : "Couldn't remove that template", {
        description: getErrorMessage(error),
      });
    },

    onSuccess: (saved, { template, favorite }) => {
      if (saved)
        patchCachedTemplate(queryClient, saved.id, (current) => ({
          ...current,
          favorites_count: saved.favorites_count,
        }));

      if (favorite) {
        toast.success('Added to favorites', {
          description: `“${template.name}” is on your shelf.`,
          action:
            location.pathname === '/favorites'
              ? undefined
              : { label: 'View', onClick: () => navigate('/favorites') },
        });
      } else {
        toast('Removed from favorites', {
          description: `“${template.name}” is off your shelf.`,
          icon: createElement(HeartOff, { className: 'size-5 text-rose', 'aria-hidden': true }),
          duration: 6000,
          action: { label: 'Undo', onClick: () => mutateRef.current({ template, favorite: true }) },
        });
      }
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites }),
  });

  const { mutate } = mutation;
  useEffect(() => {
    mutateRef.current = mutate;
  }, [mutate]);
  return mutation;
}
