import { encodeUtf8, toBase64, toBase64Url, fromBase64 } from './base64';

const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_KEYLEN = 64; // bytes
const PASSWORD_DIGEST = 'SHA-512';

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await deriveKey(password, salt, PASSWORD_ITERATIONS, PASSWORD_DIGEST, PASSWORD_KEYLEN);
  return [PASSWORD_ITERATIONS, PASSWORD_DIGEST.toLowerCase(), toBase64(salt), toBase64(derived)].join('$');
}

export async function verifyPassword(password: string, stored?: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const [iterationStr, digest, saltB64, hashB64] = parts;
  const iterations = Number(iterationStr);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const salt = fromBase64(saltB64);
  const expected = fromBase64(hashB64);
  const derived = await deriveKey(password, salt, iterations, digest.toUpperCase(), expected.byteLength);
  return constantTimeEqual(expected, derived);
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
  hash: string,
  length: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', encodeUtf8(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash }, keyMaterial, length * 8);
  return new Uint8Array(derivedBits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export function randomBase64Url(bytes = 48): string {
  const array = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64Url(array);
}

export async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encodeUtf8(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
