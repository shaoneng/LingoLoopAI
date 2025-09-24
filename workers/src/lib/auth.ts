import type { PrismaClient, Prisma } from '@prisma/client/edge';
import type { Bindings } from '../types';
import { hashPassword as hashPw, verifyPassword as verifyPw, randomBase64Url, sha256 } from './crypto';
import { signJwt } from './jwt';

export const ACCESS_TOKEN_TTL_SEC = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_DAYS = 14;
export const PASSWORD_RESET_TOKEN_TTL_MIN = 30;

export async function hashPassword(password: string): Promise<string> {
  return hashPw(password);
}

export async function verifyPassword(password: string, stored?: string | null): Promise<boolean> {
  return verifyPw(password, stored ?? null);
}

export async function createAccessToken(env: Bindings, payload: Record<string, unknown>, expiresInSec = ACCESS_TOKEN_TTL_SEC): Promise<string> {
  if (!env.AUTH_JWT_SECRET) {
    throw new Error('Missing AUTH_JWT_SECRET');
  }
  return signJwt(env.AUTH_JWT_SECRET, payload, expiresInSec);
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createAuthSession({
  prisma,
  userId,
  ttlDays = REFRESH_TOKEN_TTL_DAYS,
}: {
  prisma: PrismaExecutor;
  userId: string;
  ttlDays?: number;
}) {
  const token = randomBase64Url(48);
  const hashed = await sha256(token);
  const expiresAt = refreshTokenExpiresAt(ttlDays);
  const session = await prisma.authSession.create({
    data: {
      userId,
      refreshToken: hashed,
      expiresAt,
    },
  });
  return { token, session };
}

export async function consumeRefreshToken({
  prisma,
  token,
}: {
  prisma: PrismaExecutor;
  token: string;
}) {
  const hashed = await sha256(token);
  const session = await prisma.authSession.findUnique({
    where: { refreshToken: hashed },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  await prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
  const { token: nextToken, session: nextSession } = await createAuthSession({ prisma, userId: session.userId });
  return { user: session.user, refreshToken: nextToken, session: nextSession };
}

export async function revokeSessionByToken({ prisma, token }: { prisma: PrismaExecutor; token: string }) {
  const hashed = await sha256(token);
  await prisma.authSession.deleteMany({ where: { refreshToken: hashed } });
}

export async function createPasswordResetToken({
  prisma,
  userId,
  ttlMinutes = PASSWORD_RESET_TOKEN_TTL_MIN,
}: {
  prisma: PrismaExecutor;
  userId: string;
  ttlMinutes?: number;
}) {
  const token = randomBase64Url(32);
  const tokenHash = await sha256(token);
  const expiresAt = passwordResetTokenExpiresAt(ttlMinutes);
  const record = await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
  return { token, record };
}

export async function consumePasswordResetToken({
  prisma,
  token,
}: {
  prisma: PrismaExecutor;
  token: string;
}) {
  const tokenHash = await sha256(token);
  const now = new Date();
  const existing = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!existing || existing.usedAt || existing.expiresAt <= now) {
    return null;
  }
  await prisma.passwordResetToken.update({
    where: { id: existing.id },
    data: { usedAt: now },
  });
  return existing;
}

function refreshTokenExpiresAt(ttlDays: number) {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + ttlDays);
  return expires;
}

function passwordResetTokenExpiresAt(ttlMin: number) {
  const expires = new Date();
  expires.setUTCMinutes(expires.getUTCMinutes() + ttlMin);
  return expires;
}
