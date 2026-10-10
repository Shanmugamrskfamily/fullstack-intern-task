import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/modules/templates/categories.js';
import { TemplateModel } from '../src/modules/templates/template.model.js';
import type { PublicTemplate } from '../src/modules/templates/template.serializer.js';
import { SEED_TEMPLATES } from '../src/seed/templates.data.js';
import { MISSING_ID, anyTemplateId, api, authHeader, registerUser } from './helpers.js';

const TOTAL = SEED_TEMPLATES.length;

const EXPECTED_COUNTS: Record<string, number> = {
  'landing-page': 3,
  dashboard: 3,
  'e-commerce': 3,
  portfolio: 2,
  blog: 2,
  'mobile-app': 3,
};

async function listTemplates(query: Record<string, string | number> = {}) {
  const res = await api().get('/api/templates').query(query).expect(200);
  return res.body as {
    data: PublicTemplate[];
    meta: { page: number; limit: number; total: number; total_pages: number };
  };
}

const namesOf = (templates: PublicTemplate[]) => templates.map((t) => t.name);
const slugsOf = (templates: PublicTemplate[]) => templates.map((t) => t.slug);

/** Seed templates whose name or description contains the term, ignoring case. */
const seedMatches = (term: string) =>
  SEED_TEMPLATES.filter((t) =>
    [t.name, t.description].some((text) => text.toLowerCase().includes(term.toLowerCase())),
  ).map((t) => t.slug);

describe('GET /api/templates', () => {
  it('lists the whole catalogue with pagination meta', async () => {
    expect(TOTAL).toBe(16);

    const { data, meta } = await listTemplates();

    expect(data).toHaveLength(TOTAL);
    expect(meta).toEqual({ page: 1, limit: 50, total: TOTAL, total_pages: 1 });
  });

  it('returns each template as a public DTO with absolute thumbnail URLs', async () => {
    const { data } = await listTemplates();

    for (const template of data) {
      expect(Object.keys(template).sort()).toEqual(
        [
          'category',
          'category_slug',
          'created_at',
          'description',
          'favorites_count',
          'features',
          'id',
          'name',
          'pages',
          'slug',
          'thumbnail_url',
        ].sort(),
      );
      expect(template.id).toMatch(/^[a-f\d]{24}$/);
      expect(template.thumbnail_url).toMatch(
        new RegExp(`^https?://[^/]+/static/thumbnails/${template.slug}\\.svg$`),
      );
      expect(CATEGORIES).toContainEqual({ slug: template.category_slug, label: template.category });
      expect(template.features.length).toBeGreaterThan(0);
      expect(template.pages.length).toBeGreaterThan(0);
      expect(template.favorites_count).toBe(0);
      expect(new Date(template.created_at).toISOString()).toBe(template.created_at);
    }
  });

  it('lets clients and CDNs cache the public catalogue briefly', async () => {
    const res = await api().get('/api/templates').expect(200);
    expect(res.headers['cache-control']).toBe('public, max-age=30, stale-while-revalidate=120');
  });

  it('treats empty query values as not provided', async () => {
    const { meta } = await listTemplates({ search: '', category: '', sort: '', page: '' });
    expect(meta.total).toBe(TOTAL);
  });

  it('rejects unknown query parameters', async () => {
    const res = await api().get('/api/templates?colour=blue').expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].message).toMatch(/unrecognized key.*colour/i);
  });

  describe('search', () => {
    it('matches template names, ignoring case', async () => {
      const { data } = await listTemplates({ search: 'NIMBUS' });
      expect(slugsOf(data)).toEqual(['nimbus-saas-landing']);
    });

    it('matches descriptions too', async () => {
      const expected = seedMatches('pricing');
      expect(expected.length).toBeGreaterThan(1);

      const { data } = await listTemplates({ search: 'pricing' });

      expect(slugsOf(data).sort()).toEqual(expected.sort());
    });

    it('trims the term and collapses repeated spaces', async () => {
      const { data } = await listTemplates({ search: '   nimbus    saas  ' });
      expect(slugsOf(data)).toEqual(['nimbus-saas-landing']);
    });

    it('returns an empty page (not an error) when nothing matches', async () => {
      const { data, meta } = await listTemplates({ search: 'no template is called this' });

      expect(data).toEqual([]);
      expect(meta).toEqual({ page: 1, limit: 50, total: 0, total_pages: 1 });
    });

    it.each(['(.*', '.*', '[a-z]+', '^N', '\\', '$where', 'a|b'])(
      'matches the regex metacharacters in %j literally',
      async (search) => {
        const { data } = await listTemplates({ search });
        expect(data).toEqual([]);
      },
    );

    it('rejects terms longer than 64 characters', async () => {
      const res = await api()
        .get('/api/templates')
        .query({ search: 'x'.repeat(65) })
        .expect(400);

      expect(res.body.error.details).toEqual([
        { field: 'search', message: 'Search can be at most 64 characters' },
      ]);
    });

    it('can be combined with a category filter', async () => {
      const { data } = await listTemplates({ category: 'dashboard', search: 'finance' });
      expect(slugsOf(data)).toEqual(['ledger-finance']);
    });
  });

  describe('category filter', () => {
    it.each(Object.entries(EXPECTED_COUNTS))('filters by the slug "%s"', async (slug, count) => {
      const label = CATEGORIES.find((c) => c.slug === slug)!.label;

      const { data, meta } = await listTemplates({ category: slug });

      expect(data).toHaveLength(count);
      expect(meta.total).toBe(count);
      expect(data.every((t) => t.category === label && t.category_slug === slug)).toBe(true);
    });

    it.each(['Landing Page', 'landing page', 'LANDING-PAGE'])(
      'also accepts the label or any letter case (%j)',
      async (category) => {
        const { data } = await listTemplates({ category });
        expect(data.map((t) => t.category_slug)).toEqual(Array(3).fill('landing-page'));
      },
    );

    it('rejects an unknown category and lists the valid ones', async () => {
      const res = await api().get('/api/templates?category=spaceships').expect(400);

      expect(res.body.error.details).toEqual([
        {
          field: 'category',
          message:
            'Unknown category. Use one of: landing-page, dashboard, e-commerce, portfolio, blog, mobile-app',
        },
      ]);
    });

    it('rejects a category given more than once', async () => {
      const res = await api().get('/api/templates?category=blog&category=dashboard').expect(400);

      expect(res.body.error.details).toEqual([
        { field: 'category', message: 'Category must be a single value' },
      ]);
    });
  });

  describe('sorting', () => {
    it('sorts by name A to Z with sort=name', async () => {
      const { data } = await listTemplates({ sort: 'name' });

      const names = namesOf(data);
      expect(names).toEqual([...names].sort());
    });

    it('sorts by date added, newest first, with sort=newest', async () => {
      const { data } = await listTemplates({ sort: 'newest' });

      const expected = [...SEED_TEMPLATES]
        .sort((a, b) => b.added.localeCompare(a.added) || a.name.localeCompare(b.name))
        .map((t) => t.slug);
      expect(slugsOf(data)).toEqual(expected);
      expect(data[0]?.slug).toBe('nimbus-saas-landing');
    });

    it('defaults to most popular, breaking ties by name', async () => {
      const { data } = await listTemplates();

      // Nothing is favorited yet, so "popular" falls back to alphabetical order.
      const names = namesOf(data);
      expect(names).toEqual([...names].sort());
    });

    it('puts the most favorited templates first with sort=popular', async () => {
      const [alice, bob] = await Promise.all([registerUser(), registerUser()]);
      const pantry = await anyTemplateId('pantry-grocery');
      const wayfare = await anyTemplateId('wayfare-travel');

      for (const { token } of [alice, bob]) {
        await api().post(`/api/favorites/${wayfare}`).set(authHeader(token)).expect(201);
      }
      await api().post(`/api/favorites/${pantry}`).set(authHeader(alice.token)).expect(201);

      const { data } = await listTemplates({ sort: 'popular' });

      expect(data.slice(0, 2).map((t) => [t.slug, t.favorites_count])).toEqual([
        ['wayfare-travel', 2],
        ['pantry-grocery', 1],
      ]);
      const rest = namesOf(data.slice(2));
      expect(rest).toEqual([...rest].sort());
    });

    it('rejects an unknown sort order', async () => {
      const res = await api().get('/api/templates?sort=price').expect(400);

      expect(res.body.error.details).toEqual([
        { field: 'sort', message: 'Sort must be one of: popular, newest, name' },
      ]);
    });
  });

  describe('pagination', () => {
    it('splits the catalogue into pages of the requested size', async () => {
      const first = await listTemplates({ limit: 5 });

      expect(first.data).toHaveLength(5);
      expect(first.meta).toEqual({ page: 1, limit: 5, total: 16, total_pages: 4 });

      const last = await listTemplates({ limit: 5, page: 4 });
      expect(last.data).toHaveLength(1);
      expect(last.meta).toEqual({ page: 4, limit: 5, total: 16, total_pages: 4 });
    });

    it('returns every template exactly once across the pages', async () => {
      const pages = await Promise.all(
        [1, 2, 3, 4].map((page) => listTemplates({ limit: 5, page, sort: 'name' })),
      );

      const ids = pages.flatMap(({ data }) => data.map((t) => t.id));
      expect(ids).toHaveLength(TOTAL);
      expect(new Set(ids).size).toBe(TOTAL);
    });

    it('returns an empty list for a page past the end', async () => {
      const { data, meta } = await listTemplates({ limit: 5, page: 5 });

      expect(data).toEqual([]);
      expect(meta).toEqual({ page: 5, limit: 5, total: 16, total_pages: 4 });
    });

    it.each([
      ['limit', '0'],
      ['limit', '51'],
      ['limit', '2.5'],
      ['limit', 'ten'],
      ['page', '0'],
      ['page', '-1'],
      ['page', '1001'],
    ])('rejects %s=%s', async (key, value) => {
      const res = await api().get(`/api/templates?${key}=${value}`).expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe(key);
    });
  });
});

describe('GET /api/templates/categories', () => {
  it('returns every category with its template count, in a fixed order', async () => {
    const res = await api().get('/api/templates/categories').expect(200);

    expect(res.body).toEqual({
      success: true,
      data: CATEGORIES.map((c) => ({
        slug: c.slug,
        name: c.label,
        count: EXPECTED_COUNTS[c.slug],
      })),
    });
  });

  it('includes categories that currently have no templates', async () => {
    const blogPosts = await TemplateModel.find({ category: 'Blog' }).select('_id').lean();
    await TemplateModel.updateMany({ category: 'Blog' }, { $set: { category: 'Portfolio' } });
    try {
      const res = await api().get('/api/templates/categories').expect(200);
      expect(res.body.data).toContainEqual({ slug: 'blog', name: 'Blog', count: 0 });
    } finally {
      for (const { _id } of blogPosts) {
        await TemplateModel.updateOne({ _id }, { $set: { category: 'Blog' } });
      }
    }
  });
});

describe('GET /api/templates/:id', () => {
  it('returns a single template', async () => {
    const id = await anyTemplateId('folio-studio');

    const res = await api().get(`/api/templates/${id}`).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id,
      slug: 'folio-studio',
      name: 'Folio Studio',
      category: 'Portfolio',
      category_slug: 'portfolio',
    });
  });

  it('matches the same template in the list', async () => {
    const { data } = await listTemplates();
    const template = data[0]!;

    const res = await api().get(`/api/templates/${template.id}`).expect(200);

    expect(res.body.data).toEqual(template);
  });

  it('answers 404 NOT_FOUND for an id that does not exist', async () => {
    const res = await api().get(`/api/templates/${MISSING_ID}`).expect(404);

    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Template not found' });
  });

  it.each(['not-an-id', '123', `${MISSING_ID}0`, 'zzzzzzzzzzzzzzzzzzzzzzzz'])(
    'answers 400 for the malformed id %j',
    async (id) => {
      const res = await api().get(`/api/templates/${id}`).expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toEqual([
        { field: 'id', message: 'The template id is not valid' },
      ]);
    },
  );
});
