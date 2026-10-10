import { http } from '@/lib/http';
import type { ApiSuccess, FavoriteTemplate } from '@/types/api';

export const favoritesApi = {
  async list(signal?: AbortSignal): Promise<FavoriteTemplate[]> {
    return (await http.get<ApiSuccess<FavoriteTemplate[]>>('/favorites', { signal })).data.data;
  },
  async add(templateId: string): Promise<FavoriteTemplate> {
    return (
      await http.post<ApiSuccess<FavoriteTemplate>>(`/favorites/${encodeURIComponent(templateId)}`)
    ).data.data;
  },
  async remove(templateId: string): Promise<void> {
    await http.delete(`/favorites/${encodeURIComponent(templateId)}`);
  },
};
