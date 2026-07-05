// /api/auth — GET current session · POST login · DELETE logout
// TESTER MODE: mock auth. Any valid @oliveliving.com email + password (8+ chars) logs in.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { logAction, requireSession } from '@/lib/auth-server';
import { IS_TESTER_MODE, SESSION_COOKIE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

// ---- in-memory failed-attempt lockout: 5 failures / email / 10 min ----
const FAILED_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const failedAttempts = new Map<string, number[]>();

function recentFailures(email: string): number[] {
  const now = Date.now();
  const recent = (failedAttempts.get(email) ?? []).filter((t) => now - t < FAILED_WINDOW_MS);
  if (recent.length) failedAttempts.set(email, recent);
  else failedAttempts.delete(email);
  return recent;
}

function recordFailure(email: string): void {
  if (failedAttempts.size > 1000) failedAttempts.clear(); // bounded memory
  failedAttempts.set(email, [...recentFailures(email), Date.now()]);
}

export async function GET() {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;
    return NextResponse.json({ email: session.email });
  } catch (err) {
    console.error('GET /api/auth failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: `Validation failed — ${issue?.path.join('.') || 'body'}: ${issue?.message ?? 'invalid input'}` },
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { password, remember } = parsed.data;

    // Lockout check BEFORE any credential evaluation.
    if (recentFailures(email).length >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    // Domain enforcement (layer 1 of 3 — middleware + requireSession re-check).
    if (!/@oliveliving\.com$/i.test(email)) {
      recordFailure(email);
      return NextResponse.json({ error: 'Access restricted to @oliveliving.com accounts' }, { status: 401 });
    }
    if (password.length < 8) {
      recordFailure(email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // TESTER MODE: mock auth — any valid @oliveliving.com email + 8+ char password.
    // PRODUCTION (later phase): verify against Supabase Auth instead, e.g.:
    //   const supabase = getServiceClient();
    //   const { error } = await supabase!.auth.signInWithPassword({ email, password });
    //   if (error) { recordFailure(email); return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }); }
    failedAttempts.delete(email);

    // `remember` is accepted but the 30-min sliding inactivity window is company
    // policy — middleware re-issues the cookie on every authenticated request.
    cookies().set(SESSION_COOKIE, createSessionToken(email), sessionCookieOptions());
    logAction(email, 'login', undefined, undefined, {
      success: true,
      remember: remember ?? false,
      mode: IS_TESTER_MODE ? 'tester' : 'production',
    });
    return NextResponse.json({ email });
  } catch (err) {
    console.error('POST /api/auth failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = requireSession();
    cookies().set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
    if (!('response' in session)) logAction(session.email, 'logout');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/auth failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
