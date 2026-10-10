import { setServers } from 'node:dns';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

// Defence in depth against NoSQL injection: unknown query paths are dropped, and any
// user-supplied object containing `$` operators is wrapped in `$eq` unless explicitly trusted.
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

type MemoryServer = { getUri(dbName?: string): string; stop(): Promise<boolean> };
let memoryServer: MemoryServer | undefined;

export interface DatabaseConnection {
  inMemory: boolean;
}

/**
 * Connects to MongoDB. Without MONGODB_URI (development and tests only), it starts an
 * in-memory MongoDB so the project runs with zero setup.
 */
export async function connectDatabase(uri = env.MONGODB_URI): Promise<DatabaseConnection> {
  let target = uri;
  let inMemory = false;

  if (!target) {
    if (env.isProduction) throw new Error('MONGODB_URI is required in production');
    const { MongoMemoryServer } = await import('mongodb-memory-server-core');
    memoryServer = await MongoMemoryServer.create();
    target = memoryServer.getUri();
    inMemory = true;
    if (!env.isTest) {
      logger.warn('MONGODB_URI is not set: using an in-memory MongoDB. Data resets on restart.');
    }
  }

  // Some local networks (VPNs, DNS filters) refuse the SRV lookup behind mongodb+srv://.
  if (env.dnsServers.length > 0) {
    setServers(env.dnsServers);
    logger.info({ dnsServers: env.dnsServers }, 'Using custom DNS servers');
  }

  await mongoose.connect(target, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
    autoIndex: true,
  });

  logger.info({ inMemory, db: env.MONGODB_DB_NAME }, 'MongoDB connected');
  return { inMemory };
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;
