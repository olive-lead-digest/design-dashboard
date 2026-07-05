// POST /api/projects/[id]/floor-plans/[planId]/send-to-owner
// 🔴 TESTER MODE: email PREVIEW only — routing locked to the two test addresses.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { buildEmailPreview } from '@/lib/email';
import { getDb, uuid } from '@/lib/store';
import { sanitize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string; planId: string } };

const BodySchema = z.object({ custom_message: z.string().max(2000).optional() });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const project = db.projects.find((p) => p.id === params.id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const plan = db.floorPlans.find((f) => f.id === params.planId && f.project_id === project.id);
    if (!plan) return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed — custom_message must be a string' }, { status: 400 });
    }

    const summary = parsed.data.custom_message
      ? sanitize(parsed.data.custom_message)
      : plan.design_notes ?? `Floor plan V${plan.plan_version} for ${project.name} is ready for your review.`;

    // 🔴 No productionRecipient passed — resolveEmailRouting() pins tester from/to.
    const email_preview = buildEmailPreview({
      subject: `Your ${project.name} — Floor Plan V${plan.plan_version} Ready`,
      projectName: project.name,
      location: project.property_location,
      updateType: 'Floor Plan',
      summary,
    });

    const now = new Date().toISOString();
    plan.sent_to_owner_at = now;

    db.communications.push({
      id: uuid(),
      project_id: project.id,
      communication_type: 'floor_plan_sent',
      subject: email_preview.subject,
      message: summary,
      sent_by_email: session.email,
      sent_to_owner: true,
      sent_to_owner_at: now,
      owner_read_at: null,
      created_at: now,
      metadata: { related_plan_id: plan.id },
    });

    logAction(session.email, 'send_to_owner', 'floor_plans', plan.id, {
      mode: 'tester',
      from: email_preview.from,
      to: email_preview.to,
    });

    return NextResponse.json({ status: 'sent', email_preview });
  } catch (err) {
    console.error('POST /api/projects/[id]/floor-plans/[planId]/send-to-owner failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
