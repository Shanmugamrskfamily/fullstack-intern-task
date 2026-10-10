import { http } from '@/lib/http';
import type { ApiSuccess, Session, User } from '@/types/api';
import type { LoginValues, RegisterPayload } from './schemas';

export const authApi = {
  login: async (input: LoginValues) =>
    (await http.post<ApiSuccess<Session>>('/auth/login', input)).data.data,
  register: async (input: RegisterPayload) =>
    (await http.post<ApiSuccess<Session>>('/auth/register', input)).data.data,
  me: async () => (await http.get<ApiSuccess<{ user: User }>>('/auth/me')).data.data.user,
};
