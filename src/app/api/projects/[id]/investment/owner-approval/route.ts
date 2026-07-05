// POST /api/projects/[id]/investment/owner-approval — toggle owner approval.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { getDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const BodySchema = z.object({ owner_approval: z.boolean() });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    if (!db.projects.some((p) => p.id === params.id)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const investment = db.investments.find((i) => i.project_id === params.id);
    if (!investment) return NextResponse.json({ error: 'No investment requirements yet' }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed — owner_approval must be a boolean' }, { status: 400 });
    }

    investment.approved_by_owner = parsed.data.owner_approval;
    investment.updated_at = new Date().toISOString();

    logAction(session.email, 'owner_approval', 'investment_requirements', investment.id, {
      approved_by_owner: investment.approved_by_owner,
    });

    return NextResponse.json({ status: parsed.data.owner_approval ? 'approved' : 'revoked' });
  } catch (err) {
    console.error('POST /api/projects/[id]/investment/owner-approval failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
