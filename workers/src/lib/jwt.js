import { encodeUtf8, toBase64Url, fromBase64Url, decodeUtf8, toArrayBuffer } from './base64';
export async function signJwt(secret, payload, expiresInSec) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const body = { ...payload, iat: now, exp: now + expiresInSec };
    const encodedHeader = toBase64Url(encodeUtf8(JSON.stringify(header)));
    const encodedBody = toBase64Url(encodeUtf8(JSON.stringify(body)));
    const signature = await hmacSha256(secret, `${encodedHeader}.${encodedBody}`);
    return `${encodedHeader}.${encodedBody}.${signature}`;
}
async function hmacSha256(secret, data) {
    const key = await crypto.subtle.importKey('raw', toArrayBuffer(encodeUtf8(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, toArrayBuffer(encodeUtf8(data)));
    return toBase64Url(signature);
}
export async function verifyJwt(token, secret) {
    if (!token)
        return null;
    const parts = token.split('.');
    if (parts.length !== 3)
        return null;
    const [encodedHeader, encodedBody, signature] = parts;
    const expected = await hmacSha256(secret, `${encodedHeader}.${encodedBody}`);
    if (!timingSafeEqual(signature, expected)) {
        return null;
    }
    try {
        const body = JSON.parse(decodeUtf8(fromBase64Url(encodedBody)));
        const now = Math.floor(Date.now() / 1000);
        if (typeof body.exp === 'number' && body.exp < now) {
            return null;
        }
        return body;
    }
    catch {
        return null;
    }
}
function timingSafeEqual(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i += 1) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}
