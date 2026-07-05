// POST /api/projections/[projectionId]/send
// 🔴 TESTER MODE: recipient_emails is ACCEPTED but IGNORED — the preview and the
// stored recipients are ALWAYS the hardcoded test addresses. Nothing is dispatched.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { TESTER_RECEIVER } from '@/lib/constants';
import { buildEmailPreview } from '@/lib/email';
import { getDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Params = { params: { projectionId: string } };

const BodySchema = z.object({
  recipient_emails: z.array(z.string()).optional(), // accepted, IGNORED in tester mode
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const projection = db.projections.find((p) => p.id === params.projectionId);
    if (!projection) return NextResponse.json({ error: 'Projection not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed — recipient_emails must be a string array' }, { status: 400 });
    }

    const insights = Array.isArray(projection.data.insights) ? projection.data.insights : [];
    const summary = insights.slice(0, 2).join('. ') || 'The latest portfolio projection is ready for review.';

    // 🔴 No productionRecipient — resolveEmailRouting() pins from/to to the test pair.
    const email_preview = buildEmailPreview({
      subject: projection.projection_title,
      projectName: 'Olive Living Portfolio',
      updateType: 'Projections Report',
      summary,
    });

    // Tester constant only — requested recipients are never stored or emailed.
    projection.recipients_emails = [TESTER_RECEIVER];

    logAction(session.email, 'send_projections', 'projections', projection.id, {
      requested_recipients: parsed.data.recipient_emails?.length ?? 0,
      mode: 'tester',
      from: email_preview.from,
      to: email_preview.to,
    });

    return NextResponse.json({
      status: 'sent',
      email_preview,
      note: 'Tester mode: recipients ignored; routed to test emails.',
    });
  } catch (err) {
    console.error('POST /api/projections/[projectionId]/send failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
