import request from 'supertest';
import { createApp } from '../src/app.js';
import { TemplateModel } from '../src/modules/templates/template.model.js';
import type { PublicUser } from '../src/modules/users/user.serializer.js';

/** One app per test file. Rate limits are off unless a test builds its own app. */
export const app = createApp();

export const api = () => request(app);

/** Meets every password rule: 8+ characters with a lowercase, an uppercase and a digit. */
export const VALID_PASSWORD = 'Layora@2026';

let emailCounter = 0;

/** A unique, valid email address for each call. */
export const uniqueEmail = () => `user${Date.now()}${++emailCounter}@example.com`;

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export const newUser = (overrides: Partial<RegisterBody> = {}): RegisterBody => ({
  name: 'Test User',
  email: uniqueEmail(),
  password: VALID_PASSWORD,
  ...overrides,
});

export interface RegisteredUser {
  token: string;
  user: PublicUser;
  password: string;
}

/** Registers an account through the API and returns its session. */
export async function registerUser(overrides: Partial<RegisterBody> = {}): Promise<RegisteredUser> {
  const body = newUser(overrides);
  const res = await api().post('/api/auth/register').send(body).expect(201);
  return { token: res.body.data.token, user: res.body.data.user, password: body.password };
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

/** The id of a seeded template: a specific one by slug, or any of them. */
export async function anyTemplateId(slug?: string): Promise<string> {
  const template = await TemplateModel.findOne(slug ? { slug } : {})
    .select('_id')
    .lean();
  if (!template) throw new Error(`No seeded template found${slug ? ` for "${slug}"` : ''}`);
  return String(template._id);
}

/** A well-formed ObjectId that matches no document. */
export const MISSING_ID = '0123456789abcdef01234567';

export const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
