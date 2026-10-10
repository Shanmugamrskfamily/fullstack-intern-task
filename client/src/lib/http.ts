import axios from 'axios';
import { toApiError } from './api-error';
import { tokenStorage } from './token';

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

/** Fired when an authenticated request comes back 401 (expired or revoked session). */
export const authEvents = new EventTarget();
export const UNAUTHORIZED_EVENT = 'unauthorized';

const AUTH_ENDPOINTS = /\/auth\/(login|register)$/;

export const http = axios.create({
  baseURL: API_BASE_URL,
  // Generous: the free-tier API can take ~50 s to wake from sleep.
  timeout: 75_000,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : '';
    const sentToken = axios.isAxiosError(error) && Boolean(error.config?.headers?.Authorization);

    if (apiError.status === 401 && sentToken && !AUTH_ENDPOINTS.test(url)) {
      authEvents.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: apiError }));
    }
    return Promise.reject(apiError);
  },
);
