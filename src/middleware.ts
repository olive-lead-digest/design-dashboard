import { NextRequest, NextResponse } from 'next/server';

/**
 * Security middleware (Edge runtime):
 *  1. Session verification (HMAC-SHA256 via WebCrypto) on every request
 *  2. @oliveliving.com domain enforcement (layer 2 of 3)
 *  3. Rate limiting on /api/* (RATE_LIMIT/min per ip+user)
 *  4. Sliding 30-min inactivity window (cookie re-issued on activity)
 */

const SESSION_COOKIE = 'dd_session';
const SESSION_MAX_AGE = 30 * 60; // seconds
const RATE_LIMIT = 50; // requests / minute
const PUBLIC_PATHS = ['/login'];
const PUBLIC_API = ['/api/auth'];

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Buffer.from(new Uint8Array(sig)).toString('base64url');
}

async function verifyToken(token: string | undefined, secret: string): Promise<{ email: string } | null> {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = await hmac(payload, secret);
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { email: string; exp: number };
    if (data.exp < Date.now()) return null;
    if (!data.email.toLowerCase().endsWith('@oliveliving.com')) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api');
  const secret = process.env.SESSION_SECRET || 'dev-only-secret-change-in-vercel';

  // ---- rate limiting on all API routes ----
  if (isApi) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}:${req.cookies.get(SESSION_COOKIE)?.value?.slice(0, 16) ?? 'anon'}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    } else if (++bucket.count > RATE_LIMIT) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
    }
    if (rateBuckets.size > 5000) rateBuckets.clear(); // bounded memory
  }

  // ---- public paths ----
  if (PUBLIC_PATHS.some((p) => pathname === p) || PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ---- session enforcement ----
  const session = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value, secret);
  if (!session) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized — @oliveliving.com session required' }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // ---- sliding inactivity window: re-issue cookie ----
  const res = NextResponse.next();
  const payload = Buffer.from(JSON.stringify({ email: session.email, exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString('base64url');
  res.cookies.set(SESSION_COOKIE, `${payload}.${await hmac(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg|images|assets).*)'],
};
