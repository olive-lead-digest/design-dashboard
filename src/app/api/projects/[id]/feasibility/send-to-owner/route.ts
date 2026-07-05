// POST /api/projects/[id]/feasibility/send-to-owner
// 🔴 TESTER MODE: builds an email PREVIEW only (theopenhotels@gmail.com →
// akashsakhrani05@gmail.com via resolveEmailRouting). Nothing is dispatched.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { buildEmailPreview } from '@/lib/email';
import { getDb, uuid } from '@/lib/store';
import { sanitize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const BodySchema = z.object({ custom_message: z.string().max(2000).optional() });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const project = db.projects.find((p) => p.id === params.id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const study = db.feasibility.find((f) => f.project_id === project.id);
    if (!study) return NextResponse.json({ error: 'No feasibility study yet' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed — custom_message must be a string' }, { status: 400 });
    }

    const summary = parsed.data.custom_message
      ? sanitize(parsed.data.custom_message)
      : study.executive_summary ?? `The feasibility study for ${project.name} is ready for your review.`;

    // 🔴 No productionRecipient passed — tester routing is locked inside resolveEmailRouting().
    const email_preview = buildEmailPreview({
      subject: `Your ${project.name} — Feasibility Study Ready`,
      projectName: project.name,
      location: project.property_location,
      updateType: 'Feasibility Study',
      summary,
    });

    const now = new Date().toISOString();
    study.status = 'Sent to Owner';
    study.sent_to_owner_at = now;

    db.communications.push({
      id: uuid(),
      project_id: project.id,
      communication_type: 'feasibility_sent',
      subject: email_preview.subject,
      message: summary,
      sent_by_email: session.email,
      sent_to_owner: true,
      sent_to_owner_at: now,
      owner_read_at: null,
      created_at: now,
      metadata: { related_feasibility_id: study.id },
    });

    logAction(session.email, 'send_to_owner', 'feasibility_studies', study.id, {
      mode: 'tester',
      from: email_preview.from,
      to: email_preview.to,
    });

    return NextResponse.json({ status: 'sent', email_preview });
  } catch (err) {
    console.error('POST /api/projects/[id]/feasibility/send-to-owner failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
