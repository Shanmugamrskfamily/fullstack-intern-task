import { describe, expect, it } from 'vitest';
import { FavoriteModel } from '../src/modules/favorites/favorite.model.js';
import { TemplateModel } from '../src/modules/templates/template.model.js';
import { seedTemplates } from '../src/seed/seed.js';
import {
  MISSING_ID,
  anyTemplateId,
  api,
  authHeader,
  pause,
  registerUser,
  type RegisteredUser,
} from './helpers.js';

const favoritesCountOf = async (templateId: string) =>
  (await TemplateModel.findById(templateId).lean())?.favorites_count;

const addFavorite = (user: RegisteredUser, templateId: string) =>
  api().post(`/api/favorites/${templateId}`).set(authHeader(user.token));

const removeFavorite = (user: RegisteredUser, templateId: string) =>
  api().delete(`/api/favorites/${templateId}`).set(authHeader(user.token));

const listFavorites = (user: RegisteredUser) =>
  api().get('/api/favorites').set(authHeader(user.token)).expect(200);

describe('favorites authentication', () => {
  it.each([
    ['GET', '/api/favorites'],
    ['POST', `/api/favorites/${MISSING_ID}`],
    ['DELETE', `/api/favorites/${MISSING_ID}`],
  ])('%s %s requires a signed-in user', async (method, path) => {
    const res = await api()[method.toLowerCase() as 'get' | 'post' | 'delete'](path).expect(401);

    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('checks the session before validating the template id', async () => {
    const res = await api().post('/api/favorites/not-an-id').expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/favorites', () => {
  it('is empty for a new account', async () => {
    const user = await registerUser();

    const res = await listFavorites(user);

    expect(res.body).toEqual({ success: true, data: [], meta: { total: 0 } });
  });

  it('is private to the user and never cached', async () => {
    const user = await registerUser();

    const res = await listFavorites(user);

    expect(res.headers['cache-control']).toBe('private, no-store');
  });

  it('lists favorite templates newest first, with the time each was saved', async () => {
    const user = await registerUser();
    const order = ['ledger-finance', 'folio-studio', 'stride-fitness'];
    for (const slug of order) {
      await addFavorite(user, await anyTemplateId(slug)).expect(201);
      await pause(5); // distinct timestamps
    }

    const res = await listFavorites(user);

    expect(res.body.meta).toEqual({ total: 3 });
    expect(res.body.data.map((t: { slug: string }) => t.slug)).toEqual([...order].reverse());
    for (const template of res.body.data) {
      expect(template).toMatchObject({
        id: expect.stringMatching(/^[a-f\d]{24}$/),
        favorited_at: expect.any(String),
        favorites_count: 1,
      });
    }
  });

  it("only shows the signed-in user's own favorites", async () => {
    const [alice, bob] = await Promise.all([registerUser(), registerUser()]);
    await addFavorite(alice, await anyTemplateId('cartly-storefront')).expect(201);

    const res = await listFavorites(bob);

    expect(res.body.data).toEqual([]);
  });

  it('skips favorites whose template was removed from the catalogue', async () => {
    const user = await registerUser();
    const removedId = await anyTemplateId('signal-newsletter');
    await addFavorite(user, removedId).expect(201);
    await addFavorite(user, await anyTemplateId('pulse-analytics')).expect(201);

    await TemplateModel.deleteOne({ _id: removedId });
    try {
      const res = await listFavorites(user);
      expect(res.body.data.map((t: { slug: string }) => t.slug)).toEqual(['pulse-analytics']);
      expect(res.body.meta.total).toBe(1);
    } finally {
      await seedTemplates(); // restores the removed template for the other tests
    }
  });
});

describe('POST /api/favorites/:templateId', () => {
  it('adds a template with 201 and returns it with favorited_at', async () => {
    const user = await registerUser();
    const templateId = await anyTemplateId('nimbus-saas-landing');

    const res = await addFavorite(user, templateId).expect(201);

    expect(res.body).toMatchObject({ success: true, message: 'Added to favorites' });
    expect(res.body.data).toMatchObject({
      id: templateId,
      slug: 'nimbus-saas-landing',
      favorites_count: 1,
      favorited_at: expect.any(String),
    });
    expect(await favoritesCountOf(templateId)).toBe(1);
  });

  it('is idempotent: adding again answers 200 and counts the favorite once', async () => {
    const user = await registerUser();
    const templateId = await anyTemplateId();
    const first = await addFavorite(user, templateId).expect(201);

    const again = await addFavorite(user, templateId).expect(200);

    expect(again.body.message).toBe('Already in your favorites');
    expect(again.body.data.favorites_count).toBe(1);
    expect(again.body.data.favorited_at).toBe(first.body.data.favorited_at);
    expect(await favoritesCountOf(templateId)).toBe(1);
    expect(await FavoriteModel.countDocuments({ template: templateId })).toBe(1);
  });

  it('stores one favorite when the same request arrives several times at once', async () => {
    const user = await registerUser();
    const templateId = await anyTemplateId();

    const results = await Promise.all(
      Array.from({ length: 5 }, () => addFavorite(user, templateId)),
    );

    expect(results.map((res) => res.status).sort()).toEqual([200, 200, 200, 200, 201]);
    expect(await favoritesCountOf(templateId)).toBe(1);
    expect(await FavoriteModel.countDocuments({ template: templateId })).toBe(1);
  });

  it('counts favorites from different users', async () => {
    const users = await Promise.all([registerUser(), registerUser(), registerUser()]);
    const templateId = await anyTemplateId();

    for (const user of users) await addFavorite(user, templateId).expect(201);

    expect(await favoritesCountOf(templateId)).toBe(3);
    const res = await api().get(`/api/templates/${templateId}`).expect(200);
    expect(res.body.data.favorites_count).toBe(3);
  });

  it('answers 404 for a template that does not exist', async () => {
    const user = await registerUser();

    const res = await addFavorite(user, MISSING_ID).expect(404);

    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Template not found' });
    expect(await FavoriteModel.countDocuments()).toBe(0);
  });

  it('answers 400 for a malformed template id', async () => {
    const user = await registerUser();

    const res = await addFavorite(user, 'not-an-id').expect(400);

    expect(res.body.error.details).toEqual([
      { field: 'templateId', message: 'The template id is not valid' },
    ]);
  });
});

describe('DELETE /api/favorites/:templateId', () => {
  it('removes a favorite with 204 and no body', async () => {
    const user = await registerUser();
    const templateId = await anyTemplateId();
    await addFavorite(user, templateId).expect(201);

    const res = await removeFavorite(user, templateId).expect(204);

    expect(res.text).toBe('');
    expect(await favoritesCountOf(templateId)).toBe(0);
    expect((await listFavorites(user)).body.data).toEqual([]);
  });

  it('is idempotent: removing twice still answers 204 and decrements once', async () => {
    const [alice, bob] = await Promise.all([registerUser(), registerUser()]);
    const templateId = await anyTemplateId();
    await addFavorite(alice, templateId).expect(201);
    await addFavorite(bob, templateId).expect(201);

    await removeFavorite(alice, templateId).expect(204);
    await removeFavorite(alice, templateId).expect(204);

    expect(await favoritesCountOf(templateId)).toBe(1);
  });

  it('leaves the count alone when the template was never a favorite', async () => {
    const [alice, bob] = await Promise.all([registerUser(), registerUser()]);
    const templateId = await anyTemplateId();
    await addFavorite(alice, templateId).expect(201);

    await removeFavorite(bob, templateId).expect(204);

    expect(await favoritesCountOf(templateId)).toBe(1);
    expect((await listFavorites(alice)).body.meta.total).toBe(1);
  });

  it('answers 204 for a template that does not exist', async () => {
    const user = await registerUser();
    await removeFavorite(user, MISSING_ID).expect(204);
  });

  it('answers 400 for a malformed template id', async () => {
    const user = await registerUser();

    const res = await removeFavorite(user, '123').expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('allows a removed template to be favorited again', async () => {
    const user = await registerUser();
    const templateId = await anyTemplateId();
    await addFavorite(user, templateId).expect(201);
    await removeFavorite(user, templateId).expect(204);

    await addFavorite(user, templateId).expect(201);

    expect(await favoritesCountOf(templateId)).toBe(1);
  });
});
