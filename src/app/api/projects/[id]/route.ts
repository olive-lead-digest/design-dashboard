// /api/projects/[id] — GET full project bundle · PUT update
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { PROJECT_STATUSES } from '@/lib/constants';
import { getDb, refreshOverdue } from '@/lib/store';
import { sanitize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  property_location: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
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
    const project = db.projects.find((p) => p.id === params.id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    refreshOverdue();
    return NextResponse.json({
      project,
      documents: db.documents
        .filter((d) => d.project_id === project.id)
        .sort((a, b) => Date.parse(b.uploaded_at) - Date.parse(a.uploaded_at)),
      feasibility: db.feasibility.find((f) => f.project_id === project.id) ?? null,
      floor_plans: db.floorPlans
        .filter((f) => f.project_id === project.id)
        .sort((a, b) => a.plan_version - b.plan_version),
      communications: db.communications
        .filter((c) => c.project_id === project.id)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
      tasks: db.tasks
        .filter((t) => t.project_id === project.id)
        .sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date)),
      investment: db.investments.find((i) => i.project_id === project.id) ?? null,
      // Projections are portfolio-level — return them all.
      projections: db.projections,
    });
  } catch (err) {
    console.error('GET /api/projects/[id] failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
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
    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const changes: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) {
      project.name = sanitize(parsed.data.name);
      changes.name = project.name;
    }
    if (parsed.data.status !== undefined) {
      project.status = parsed.data.status;
      changes.status = project.status;
    }
    if (parsed.data.property_location !== undefined) {
      project.property_location = sanitize(parsed.data.property_location);
      changes.property_location = project.property_location;
    }
    if (parsed.data.description !== undefined) {
      project.description = parsed.data.description === null ? null : sanitize(parsed.data.description);
      changes.description = project.description;
    }
    project.updated_at = new Date().toISOString();

    logAction(session.email, 'update_project', 'projects', project.id, changes);
    return NextResponse.json(project);
  } catch (err) {
    console.error('PUT /api/projects/[id] failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
