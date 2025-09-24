const GOOGLE_TOKEN_INFO_ENDPOINT = 'https://oauth2.googleapis.com/tokeninfo';

function getClientIds() {
  const raw = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  if (!raw) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID is not configured.');
  }
  return raw.split(',').map((id) => id.trim()).filter(Boolean);
}

function isExpectedIssuer(iss) {
  return iss === 'accounts.google.com' || iss === 'https://accounts.google.com';
}

export async function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new Error('Missing Google ID token');
  }
  const url = new URL(GOOGLE_TOKEN_INFO_ENDPOINT);
  url.searchParams.set('id_token', idToken);
  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`Google tokeninfo error: ${resp.status} ${detail}`);
  }
  const payload = await resp.json();
  const clientIds = getClientIds();
  if (!clientIds.includes(payload.aud)) {
    throw new Error('Google ID token audience mismatch.');
  }
  if (!isExpectedIssuer(payload.iss)) {
    throw new Error('Unexpected Google token issuer.');
  }
  if (!payload.email) {
    throw new Error('Google token missing email claim.');
  }
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
    name: payload.name || null,
    picture: payload.picture || null,
    locale: payload.locale || null,
  };
}
