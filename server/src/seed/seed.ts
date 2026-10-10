import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { BCRYPT_ROUNDS } from '../modules/auth/auth.service.js';
import { addFavorite } from '../modules/favorites/favorite.service.js';
import { TemplateModel } from '../modules/templates/template.model.js';
import { UserModel } from '../modules/users/user.model.js';
import { logger } from '../utils/logger.js';
import { SEED_TEMPLATES, thumbnailPath } from './templates.data.js';

/** Public demo account shown in the README and on the login page. */
export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@example.com',
  password: 'Demo@1234',
} as const;

/**
 * Upserts the template catalogue by slug. Safe to run on every boot: content stays in
 * sync with the code, while `favorites_count` and `created_at` are only set on insert.
 */
export async function seedTemplates(): Promise<number> {
  const now = new Date();
  const result = await TemplateModel.bulkWrite(
    SEED_TEMPLATES.map((t) => ({
      updateOne: {
        filter: { slug: t.slug },
        update: {
          $set: {
            name: t.name,
            description: t.description,
            thumbnail_url: thumbnailPath(t.slug),
            category: t.category,
            features: t.features,
            pages: t.pages,
            updated_at: now,
          },
          $setOnInsert: { favorites_count: 0, created_at: new Date(`${t.added}T09:00:00Z`) },
        },
        upsert: true,
        timestamps: false,
      },
    })),
  );
  return result.upsertedCount;
}

/** Creates the demo account once; an existing account is never modified. */
export async function seedDemoUser() {
  const existing = await UserModel.findOne({ email: DEMO_USER.email });
  if (existing) return { user: existing, created: false };

  const user = await UserModel.create({
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    password_hash: await bcrypt.hash(DEMO_USER.password, BCRYPT_ROUNDS),
  });
  return { user, created: true };
}

/** A new demo account starts with a few favorites so the Favorites page is not empty. */
const DEMO_FAVORITES = ['nimbus-saas-landing', 'cartly-storefront', 'ledger-finance'];

async function seedDemoFavorites(userId: string) {
  const templates = await TemplateModel.find({ slug: mongoose.trusted({ $in: DEMO_FAVORITES }) })
    .select('_id')
    .lean();
  for (const template of templates) await addFavorite(userId, String(template._id));
}

export async function ensureSeedData(): Promise<void> {
  const inserted = await seedTemplates();
  const { user, created } = await seedDemoUser();
  if (created) await seedDemoFavorites(user.id);
  logger.info(
    { templates: SEED_TEMPLATES.length, newTemplates: inserted, demoUserCreated: created },
    'Seed data is up to date',
  );
}
