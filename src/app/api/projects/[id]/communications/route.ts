// /api/projects/[id]/communications — GET log (newest first) · POST create entry.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { getDb, uuid } from '@/lib/store';
import { sanitize } from '@/lib/utils';
import type { Communication } from '@/types';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const COMMUNICATION_TYPES = [
  'email',
  'dashboard_notification',
  'feasibility_sent',
  'floor_plan_sent',
  'status_update',
] as const;

const CreateCommSchema = z.object({
  communication_type: z.enum(COMMUNICATION_TYPES),
  message: z.string().min(1, 'Message is required').max(4000),
  subject: z.string().max(200).optional(),
  sent_to_owner: z.boolean().optional(),
});

function zodError(error: z.ZodError): NextResponse {
  const issue = error.issues[0];
  return NextResponse.json(
    { error: `Validation failed — ${issue?.path.join('.') || 'body'}: ${issue?.message ?? 'invalid input'}` },
    { status: 400 },
  );
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    if (!db.projects.some((p) => p.id === params.id)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const communications = db.communications
      .filter((c) => c.project_id === params.id)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    return NextResponse.json(communications);
  } catch (err) {
    console.error('GET /api/projects/[id]/communications failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const project = db.projects.find((p) => p.id === params.id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = CreateCommSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const now = new Date().toISOString();
    const sentToOwner = parsed.data.sent_to_owner ?? false;
    const communication: Communication = {
      id: uuid(),
      project_id: project.id,
      communication_type: parsed.data.communication_type,
      message: sanitize(parsed.data.message),
      subject: parsed.data.subject ? sanitize(parsed.data.subject) : null,
      sent_by_email: session.email,
      sent_to_owner: sentToOwner,
      sent_to_owner_at: sentToOwner ? now : null,
      owner_read_at: null,
      created_at: now,
      metadata: null,
    };
    db.communications.push(communication);

    logAction(session.email, 'log_communication', 'communications', communication.id, {
      communication_type: communication.communication_type,
      sent_to_owner: communication.sent_to_owner,
    });

    return NextResponse.json(communication, { status: 201 });
  } catch (err) {
    console.error('POST /api/projects/[id]/communications failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
