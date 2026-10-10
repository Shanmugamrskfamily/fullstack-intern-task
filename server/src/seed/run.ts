/**
 * Seeds the database configured in MONGODB_URI.
 *
 *   npm run seed            upsert templates + demo account (safe to repeat)
 *   npm run seed -- --fresh also delete all templates and favorites first
 */
import '../config/load-env.js';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { ensureSeedData } from './seed.js';

async function run() {
  if (!env.MONGODB_URI) {
    console.error(
      'Set MONGODB_URI to seed a real database (the dev server seeds its in-memory DB itself).',
    );
    process.exit(1);
  }
  await connectDatabase();

  if (process.argv.includes('--fresh')) {
    await Promise.all([
      mongoose.connection.collection('templates').deleteMany({}),
      mongoose.connection.collection('favorites').deleteMany({}),
    ]);
    console.log('Removed existing templates and favorites');
  }

  await ensureSeedData();
  await disconnectDatabase();
  console.log('Seeding complete');
}

run().catch(async (error: unknown) => {
  console.error('Seeding failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
