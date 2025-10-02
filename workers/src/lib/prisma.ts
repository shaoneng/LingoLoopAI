import './prismaClientShim';
import { withAccelerate } from '@prisma/extension-accelerate';
import type { PrismaClient } from '@prisma/client/edge';
import type { Bindings } from '../types';

const clientCache = new WeakMap<Bindings, PrismaClient>();

export async function getPrisma(env: Bindings): Promise<PrismaClient> {
  const cached = clientCache.get(env);
  if (cached) return cached;

  const { PrismaClient } = await import('@prisma/client/edge');

  const accelerateUrl = env.PRISMA_ACCELERATE_URL;
  const databaseUrl = env.DATABASE_URL;
  if (!accelerateUrl && !databaseUrl) {
    throw new Error('Missing PRISMA_ACCELERATE_URL or DATABASE_URL environment variable.');
  }

  let client: PrismaClient;
  if (accelerateUrl) {
    client = new PrismaClient({
      datasources: {
        db: { url: 'prisma://accelerate' },
      },
    }).$extends(withAccelerate({ accelerateUrl }));
  } else {
    client = new PrismaClient({
      datasources: {
        db: { url: databaseUrl! },
      },
    });
  }

  clientCache.set(env, client);
  return client;
}
