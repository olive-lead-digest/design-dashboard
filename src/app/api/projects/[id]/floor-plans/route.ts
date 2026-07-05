// /api/projects/[id]/floor-plans — GET list · POST generate a new version
// (tester-mode simulation of n8n Workflow 3 via autoGenerateLayout, $0).
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { autoGenerateLayout } from '@/lib/floorplan';
import { triggerWorkflow } from '@/lib/n8n';
import { getDb, uuid } from '@/lib/store';
import { sanitize } from '@/lib/utils';
import type { FloorPlan } from '@/types';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const GenerateSchema = z.object({
  property_dimensions: z
    .object({
      widthFt: z.number().positive().max(500).optional(),
      depthFt: z.number().positive().max(500).optional(),
    })
    .optional(),
  number_of_rooms: z.number().int().min(1).max(12).optional(),
  design_type: z.string().max(60).optional(),
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
    const plans = db.floorPlans
      .filter((f) => f.project_id === params.id)
      .sort((a, b) => a.plan_version - b.plan_version);
    return NextResponse.json(plans);
  } catch (err) {
    console.error('GET /api/projects/[id]/floor-plans failed', err);
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

    const body = await req.json().catch(() => ({}));
    const parsed = GenerateSchema.safeParse(body ?? {});
    if (!parsed.success) return zodError(parsed.error);

    const designType = parsed.data.design_type ? sanitize(parsed.data.design_type) : project.property_type;

    // n8n Workflow 3 (floor-plan-generator) — no-op simulate in tester mode.
    await triggerWorkflow('floor-plan-generator', { project_id: project.id, design_type: designType });

    const layout = autoGenerateLayout({
      widthFt: parsed.data.property_dimensions?.widthFt,
      depthFt: parsed.data.property_dimensions?.depthFt,
      rooms: parsed.data.number_of_rooms,
      designType,
    });

    const existing = db.floorPlans.filter((f) => f.project_id === project.id);
    const version = existing.reduce((max, f) => Math.max(max, f.plan_version), 0) + 1;
    const planId = uuid();
    const now = new Date().toISOString();

    const materials_json: Record<string, string> =
      designType === 'Commercial'
        ? {
            floors: 'Polished concrete + carpet-tile work zones',
            walls: 'Acoustic panelling, low-VOC paint',
            fixtures: 'Matte black ironmongery, glass partitions',
            lighting: '4000K task LED, linear pendants',
          }
        : {
            floors: 'Engineered oak + vitrified tile (wet areas)',
            walls: 'Low-VOC paint, oak accents',
            fixtures: 'Matte black CP fittings, brass accents',
            lighting: '3000K warm LED, cove + task',
          };

    const plan: FloorPlan = {
      id: planId,
      project_id: project.id,
      plan_version: version,
      plan_2d_svg_url: `/api/projects/${project.id}/floor-plans/${planId}/svg`,
      plan_3d_model_url: null,
      dimensions_json: {
        total_sqft: layout.rooms.reduce((sum, r) => sum + r.sqft, 0),
        rooms: layout.rooms.map((r) => ({ name: r.name, sqft: r.sqft, dimensions: `${r.w} x ${r.h}` })),
      },
      materials_json,
      created_at: now,
      generated_by: session.email,
      design_notes: `Auto-generated (tester mode) — ${designType}`,
      sent_to_owner_at: null,
    };

    db.floorPlans.push(plan);
    db.layouts[planId] = layout;

    db.communications.push({
      id: uuid(),
      project_id: project.id,
      communication_type: 'status_update',
      subject: 'Floor plans generated — ready for owner review',
      message: `Floor plan V${version} for ${project.name} was generated (${designType}, ${layout.totalW}' × ${layout.totalH}'). 2D/3D views are available on the dashboard.`,
      sent_by_email: session.email,
      sent_to_owner: false,
      sent_to_owner_at: null,
      owner_read_at: null,
      created_at: now,
      metadata: { related_plan_id: planId },
    });

    logAction(session.email, 'generate_floor_plan', 'floor_plans', planId, {
      version,
      design_type: designType,
    });

    return NextResponse.json({ status: 'generating', plan }, { status: 201 });
  } catch (err) {
    console.error('POST /api/projects/[id]/floor-plans failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
