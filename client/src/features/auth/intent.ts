import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { favoritesApi } from '@/features/favorites/api';
import { findCachedTemplate, patchCachedTemplate } from '@/features/templates/queries';
import { getErrorMessage } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import { isObjectId } from '@/lib/security';

const PREFIX = 'favorite:';

/** `?intent=favorite:<id>` from a guest's heart tap. Untrusted: the id is validated. */
export function parseFavoriteIntent(value: string | null): string | null {
  if (!value?.startsWith(PREFIX)) return null;
  const id = value.slice(PREFIX.length);
  return isObjectId(id) ? id : null;
}

export const intentTemplateName = (queryClient: QueryClient, id: string | null) =>
  id ? findCachedTemplate(queryClient, id)?.name : undefined;

/** Finishes what the guest started: saves the template right after sign-in. */
export async function completeFavoriteIntent(queryClient: QueryClient, templateId: string) {
  try {
    const saved = await favoritesApi.add(templateId);
    patchCachedTemplate(queryClient, saved.id, (t) => ({
      ...t,
      favorites_count: saved.favorites_count,
    }));
    await queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    toast.success('Saved to favorites', { description: `“${saved.name}” is on your shelf.` });
  } catch (error) {
    toast.error("Couldn't save that template", { description: getErrorMessage(error) });
  }
}
