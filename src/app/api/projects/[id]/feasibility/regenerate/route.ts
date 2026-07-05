// POST /api/projects/[id]/feasibility/regenerate — refresh the study
// (tester-mode simulation of re-running n8n Workflow 2).
import { NextRequest, NextResponse } from 'next/server';
import { logAction, requireSession } from '@/lib/auth-server';
import { triggerWorkflow } from '@/lib/n8n';
import { getDb, uuid } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const project = db.projects.find((p) => p.id === params.id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const study = db.feasibility.find((f) => f.project_id === project.id);
    if (!study) return NextResponse.json({ error: 'No feasibility study yet' }, { status: 404 });

    // n8n Workflow 2 — no-op simulate in tester mode.
    await triggerWorkflow('feasibility-generator', { project_id: project.id, regenerate: true });

    const now = new Date().toISOString();
    study.generated_at = now;
    study.status = 'Generated';
    study.sent_to_owner_at = null;

    db.communications.push({
      id: uuid(),
      project_id: project.id,
      communication_type: 'status_update',
      subject: 'Feasibility study regenerated',
      message: `The feasibility study for ${project.name} was regenerated (tester mode simulation of n8n Workflow 2).`,
      sent_by_email: session.email,
      sent_to_owner: false,
      sent_to_owner_at: null,
      owner_read_at: null,
      created_at: now,
      metadata: { related_feasibility_id: study.id },
    });

    logAction(session.email, 'regenerate_feasibility', 'feasibility_studies', study.id, {
      project_id: project.id,
    });

    return NextResponse.json({ status: 'regenerating' });
  } catch (err) {
    console.error('POST /api/projects/[id]/feasibility/regenerate failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
