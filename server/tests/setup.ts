import { afterAll, afterEach, beforeAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { FavoriteModel } from '../src/modules/favorites/favorite.model.js';
import { TemplateModel } from '../src/modules/templates/template.model.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { seedTemplates } from '../src/seed/seed.js';

/**
 * Each test file runs in its own forked worker with its own in-memory MongoDB
 * (MONGODB_URI is cleared in vitest.config.ts), seeded with the 16-template catalogue.
 */
beforeAll(async () => {
  await connectDatabase();
  // Unique indexes drive real behaviour (duplicate emails, one favorite per template),
  // so they must exist before the first request.
  await Promise.all([UserModel.init(), TemplateModel.init(), FavoriteModel.init()]);
  await seedTemplates();
});

/** Tests stay independent: users and favorites are wiped, templates keep their ids. */
afterEach(async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    FavoriteModel.deleteMany({}),
    TemplateModel.updateMany({}, { $set: { favorites_count: 0 } }),
  ]);
});

afterAll(async () => {
  await disconnectDatabase();
});
