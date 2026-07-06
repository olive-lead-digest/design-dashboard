import { createHmac, timingSafeEqual } from 'crypto';
import type { SessionUser } from '@/types';
import { isAllowedSessionEmail, SESSION_MAX_AGE_SECONDS } from './constants';

const SECRET = process.env.SESSION_SECRET || 'dev-only-secret-change-in-vercel';

function hmac(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

/** Create a signed session token: base64url(payload).signature */
export function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 } satisfies SessionUser),
  ).toString('base64url');
  return `${payload}.${hmac(payload)}`;
}

/** Verify token signature + expiry. Returns the session user or null. */
export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = hmac(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionUser;
    if (user.exp < Date.now()) return null;
    if (!isAllowedSessionEmail(user.email)) return null; // layer 2 enforcement (+ tester whitelist)
    return user;
  } catch {
    return null;
  }
}

/** httpOnly, Secure, SameSite session cookie attributes. */
export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
