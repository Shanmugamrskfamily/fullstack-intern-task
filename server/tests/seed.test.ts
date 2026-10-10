import { beforeEach, describe, expect, it } from 'vitest';
import { FavoriteModel } from '../src/modules/favorites/favorite.model.js';
import { addFavorite } from '../src/modules/favorites/favorite.service.js';
import { TemplateModel } from '../src/modules/templates/template.model.js';
import { syncFavoriteCounts } from '../src/seed/seed.js';
import { SEED_TEMPLATES } from '../src/seed/templates.data.js';
import { registerUser } from './helpers.js';

const sample = (slug: string) => SEED_TEMPLATES.find((t) => t.slug === slug)!.sampleSaves;
const countOf = async (slug: string) =>
  (await TemplateModel.findOne({ slug }).lean())?.favorites_count;

describe('seed popularity', () => {
  beforeEach(async () => {
    await FavoriteModel.deleteMany({});
    await syncFavoriteCounts();
  });

  it('gives most templates 100–500 sample saves and leaves two at zero', () => {
    const values = SEED_TEMPLATES.map((t) => t.sampleSaves);
    expect(values.filter((v) => v === 0)).toHaveLength(2);
    expect(values.filter((v) => v !== 0).every((v) => v >= 100 && v <= 500)).toBe(true);
  });

  it('sets each count to the sample popularity', async () => {
    for (const t of SEED_TEMPLATES) {
      expect(await countOf(t.slug)).toBe(t.sampleSaves);
    }
  });

  it('adds real favorites on top of the sample and stays correct when re-run', async () => {
    const slug = 'pulse-analytics';
    const template = await TemplateModel.findOne({ slug }).lean();
    const { user } = await registerUser();
    await addFavorite(user.id, String(template!._id));

    expect(await countOf(slug)).toBe(sample(slug) + 1);

    // Simulate drift, then let the sync repair it.
    await TemplateModel.updateOne({ slug }, { $set: { favorites_count: 999 } });
    await syncFavoriteCounts();
    await syncFavoriteCounts();
    expect(await countOf(slug)).toBe(sample(slug) + 1);
  });
});
