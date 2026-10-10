import { http } from '@/lib/http';
import type { ApiSuccess, Category, PageMeta, SortOption, Template } from '@/types/api';

export interface TemplatePage {
  items: Template[];
  meta: PageMeta;
}

export interface ListTemplatesParams {
  search?: string;
  category?: string | null;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export const templatesApi = {
  async list(
    { search, category, sort, page = 1, limit = 12 }: ListTemplatesParams,
    signal?: AbortSignal,
  ): Promise<TemplatePage> {
    const params = {
      page,
      limit,
      ...(sort ? { sort } : {}),
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
    };
    const { data } = await http.get<ApiSuccess<Template[], PageMeta>>('/templates', {
      params,
      signal,
    });
    return { items: data.data, meta: data.meta! };
  },

  async categories(signal?: AbortSignal): Promise<Category[]> {
    return (await http.get<ApiSuccess<Category[]>>('/templates/categories', { signal })).data.data;
  },

  async get(id: string, signal?: AbortSignal): Promise<Template> {
    return (
      await http.get<ApiSuccess<Template>>(`/templates/${encodeURIComponent(id)}`, { signal })
    ).data.data;
  },
};
