import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySessionToken } from './auth';
import { SESSION_COOKIE } from './constants';
import { audit } from './store';

/**
 * Layer 3 enforcement — every API route revalidates the signed session and
 * the @oliveliving.com domain server-side (never trusts middleware alone).
 * Returns the caller's email, or a ready-made 401 response.
 */
export function requireSession(): { email: string } | { response: NextResponse } {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = verifySessionToken(token);
  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized — @oliveliving.com session required' }, { status: 401 }) };
  }
  return { email: user.email };
}

export function clientIp(): string {
  return headers().get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export function logAction(email: string, action: string, table?: string, recordId?: string, newValues?: Record<string, unknown>) {
  audit({
    user_email: email,
    action,
    table_name: table ?? null,
    record_id: recordId ?? null,
    old_values: null,
    new_values: newValues ?? null,
    ip_address: clientIp(),
  });
}
