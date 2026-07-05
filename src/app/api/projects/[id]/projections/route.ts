// /api/projects/[id]/projections — project-scoped proxy for portfolio projections.
// Projections are portfolio-level; GET returns them all, POST simulates regeneration
// (same behavior as /api/projections, tester-mode simulation of n8n Workflow 5).
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { triggerWorkflow } from '@/lib/n8n';
import { getDb } from '@/lib/store';
import type { ProjectionType } from '@/types';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const VALID_TYPES: readonly ProjectionType[] = ['Timeline', 'Budget', 'ROI', 'Risk'];

const RegenerateSchema = z.object({
  projection_types: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    if (!db.projects.some((p) => p.id === params.id)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(db.projections);
  } catch (err) {
    console.error('GET /api/projects/[id]/projections failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    if (!db.projects.some((p) => p.id === params.id)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = RegenerateSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed — projection_types must be a string array' }, { status: 400 });
    }

    let requested: ProjectionType[] | null = null;
    if (parsed.data.projection_types) {
      requested = parsed.data.projection_types.filter((t): t is ProjectionType =>
        (VALID_TYPES as readonly string[]).includes(t),
      );
      if (requested.length === 0) {
        return NextResponse.json(
          { error: `projection_types must include at least one of: ${VALID_TYPES.join(', ')}` },
          { status: 400 },
        );
      }
    }

    // n8n Workflow 5 (projections-generator) — no-op simulate in tester mode.
    await triggerWorkflow('projections-generator', {
      project_id: params.id,
      projection_types: requested ?? VALID_TYPES,
    });

    const nowIso = new Date().toISOString();
    const targets = db.projections.filter((p) => !requested || requested.includes(p.projection_type));
    for (const p of targets) {
      p.generated_at = nowIso;
      const insights = Array.isArray(p.data.insights)
        ? p.data.insights.filter((n) => !n.startsWith('Refreshed '))
        : [];
      insights.push(`Refreshed ${nowIso} (tester mode simulation of n8n Workflow 5)`);
      p.data.insights = insights;
    }

    logAction(session.email, 'generate_projections', 'projections', undefined, {
      project_id: params.id,
      types: requested ?? [...VALID_TYPES],
      refreshed_count: targets.length,
      mode: 'tester',
    });

    return NextResponse.json({ status: 'generating', projections: targets });
  } catch (err) {
    console.error('POST /api/projects/[id]/projections failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
