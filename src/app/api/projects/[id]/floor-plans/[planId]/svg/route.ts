// GET /api/projects/[id]/floor-plans/[planId]/svg — raw 2D SVG (image/svg+xml).
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { generateFloorPlanSVG } from '@/lib/floorplan';
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

    const layout = db.layouts[plan.id];
    if (!layout) return NextResponse.json({ error: 'No layout available for this plan' }, { status: 404 });

    const svg = generateFloorPlanSVG(layout, `${project.name} — V${plan.plan_version}`);
    return new Response(svg, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('GET /api/projects/[id]/floor-plans/[planId]/svg failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
