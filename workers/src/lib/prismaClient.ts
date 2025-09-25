// Prisma Edge 包内部仍依赖 CommonJS 全局对象，这里先注入再动态导入。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (typeof g.module === 'undefined') {
  g.module = { exports: {} };
}
if (typeof g.exports === 'undefined') {
  g.exports = g.module.exports;
}

const prismaModule = await import('@prisma/client/edge');
const accelerateModule = await import('@prisma/extension-accelerate');

export const PrismaClient = prismaModule.PrismaClient;
export const withAccelerate = accelerateModule.withAccelerate;
