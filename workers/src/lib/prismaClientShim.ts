// This file ensures Prisma Edge can import even when CommonJS globals are missing.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (typeof g.module === 'undefined') {
  g.module = { exports: {} };
}
if (typeof g.exports === 'undefined') {
  g.exports = g.module.exports;
}

export {}; // only for side effects
