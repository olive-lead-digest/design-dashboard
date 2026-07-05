// POST /api/projects/[id]/communications/send-to-owner
// 🔴 TESTER MODE: email PREVIEW only — routing locked to the two test addresses.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { buildEmailPreview } from '@/lib/email';
import { getDb } from '@/lib/store';
import { sanitize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const BodySchema = z.object({
  communication_id: z.string().min(1, 'communication_id is required'),
  custom_greeting: z.string().max(300).optional(),
});

function zodError(error: z.ZodError): NextResponse {
  const issue = error.issues[0];
  return NextResponse.json(
    { error: `Validation failed — ${issue?.path.join('.') || 'body'}: ${issue?.message ?? 'invalid input'}` },
    { status: 400 },
  );
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
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const comm = db.communications.find(
      (c) => c.id === parsed.data.communication_id && c.project_id === project.id,
    );
    if (!comm) return NextResponse.json({ error: 'Communication not found' }, { status: 404 });

    const summary = parsed.data.custom_greeting
      ? `${sanitize(parsed.data.custom_greeting)} — ${comm.message}`
      : comm.message;

    // 🔴 No productionRecipient passed — resolveEmailRouting() pins tester from/to.
    const email_preview = buildEmailPreview({
      subject: comm.subject ?? `Update on ${project.name}`,
      projectName: project.name,
      location: project.property_location,
      updateType: 'Project Update',
      summary,
    });

    const now = new Date().toISOString();
    comm.sent_to_owner = true;
    comm.sent_to_owner_at = now;

    logAction(session.email, 'send_to_owner', 'communications', comm.id, {
      mode: 'tester',
      from: email_preview.from,
      to: email_preview.to,
    });

    return NextResponse.json({ status: 'sent', email_preview });
  } catch (err) {
    console.error('POST /api/projects/[id]/communications/send-to-owner failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
