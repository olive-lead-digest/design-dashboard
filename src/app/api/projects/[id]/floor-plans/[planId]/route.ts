// GET /api/projects/[id]/floor-plans/[planId] — plan + layout + 2D SVG + 3D model JSON.
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { generate3DModel, generateFloorPlanSVG } from '@/lib/floorplan';
import { getDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string; planId: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const project = db.projects.find((p) => p.id === params.id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const plan = db.floorPlans.find((f) => f.id === params.planId && f.project_id === project.id);
    if (!plan) return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });

    const layout = db.layouts[plan.id] ?? null;
    return NextResponse.json({
      plan,
      layout,
      svg: layout ? generateFloorPlanSVG(layout, `${project.name} — V${plan.plan_version}`) : null,
      model3d: layout ? generate3DModel(layout) : null,
    });
  } catch (err) {
    console.error('GET /api/projects/[id]/floor-plans/[planId] failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
