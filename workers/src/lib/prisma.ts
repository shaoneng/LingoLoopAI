import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import type { Bindings } from '../types';

const clientCache = new WeakMap<Bindings, PrismaClient>();

export function getPrisma(env: Bindings): PrismaClient {
  const cached = clientCache.get(env);
  if (cached) return cached;

  const datasourceUrl = env.PRISMA_ACCELERATE_URL || env.DATABASE_URL;
  if (!datasourceUrl) {
    throw new Error('Missing PRISMA_ACCELERATE_URL (or DATABASE_URL fallback).');
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: datasourceUrl,
      },
    },
  }).$extends(withAccelerate());

  clientCache.set(env, client);
  return client;
}
