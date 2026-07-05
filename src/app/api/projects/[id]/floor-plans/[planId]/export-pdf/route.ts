// POST /api/projects/[id]/floor-plans/[planId]/export-pdf
// Tester mode: no server-side PDF rendering ($0) — points to the SVG endpoint.
import { NextRequest, NextResponse } from 'next/server';
import { logAction, requireSession } from '@/lib/auth-server';
import { getDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string; planId: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const project = db.projects.find((p) => p.id === params.id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const plan = db.floorPlans.find((f) => f.id === params.planId && f.project_id === project.id);
    if (!plan) return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });

    const svgUrl = `/api/projects/${project.id}/floor-plans/${plan.id}/svg`;
    logAction(session.email, 'export_floor_plan_pdf', 'floor_plans', plan.id, { mode: 'tester', svg_url: svgUrl });

    return NextResponse.json({
      pdf_url: svgUrl,
      download_link: svgUrl,
      note: 'Tester mode: SVG download; use browser Print → PDF for PDF output.',
    });
  } catch (err) {
    console.error('POST /api/projects/[id]/floor-plans/[planId]/export-pdf failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
