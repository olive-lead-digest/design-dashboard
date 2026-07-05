// GET /api/projects/[id]/feasibility — the project's feasibility study.
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { getDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    if (!db.projects.some((p) => p.id === params.id)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const study = db.feasibility.find((f) => f.project_id === params.id);
    if (!study) return NextResponse.json({ error: 'No feasibility study yet' }, { status: 404 });
    return NextResponse.json(study);
  } catch (err) {
    console.error('GET /api/projects/[id]/feasibility failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
