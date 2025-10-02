import './prismaClientShim';
import { withAccelerate } from '@prisma/extension-accelerate';
const clientCache = new WeakMap();
export async function getPrisma(env) {
    const cached = clientCache.get(env);
    if (cached)
        return cached;
    const { PrismaClient } = await import('@prisma/client/edge');
    const accelerateUrl = env.PRISMA_ACCELERATE_URL;
    const databaseUrl = env.DATABASE_URL;
    if (!accelerateUrl && !databaseUrl) {
        throw new Error('Missing PRISMA_ACCELERATE_URL or DATABASE_URL environment variable.');
    }
    let client;
    if (accelerateUrl) {
        client = new PrismaClient({
            datasources: {
                db: { url: accelerateUrl },
            },
        }).$extends(withAccelerate());
    }
    else {
        client = new PrismaClient({
            datasources: {
                db: { url: databaseUrl },
            },
        });
    }
    clientCache.set(env, client);
    return client;
}
