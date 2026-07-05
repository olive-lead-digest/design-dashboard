// GET /api/projects/[id]/tasks/accountability — per-BD-member metrics for this project.
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { getDb, refreshOverdue } from '@/lib/store';
import { percent } from '@/lib/utils';
import type { AccountabilityMetric, TeamTask } from '@/types';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

function computeMetrics(tasks: TeamTask[]): AccountabilityMetric[] {
  const byOwner = new Map<string, TeamTask[]>();
  for (const t of tasks) {
    const list = byOwner.get(t.task_owner_email) ?? [];
    list.push(t);
    byOwner.set(t.task_owner_email, list);
  }
  const metrics: AccountabilityMetric[] = [];
  byOwner.forEach((list, owner) => {
    const done = list.filter((t) => t.status === 'Done');
    const durationsDays = done
      .filter((t) => t.completed_at)
      .map((t) => (new Date(t.completed_at!).getTime() - new Date(t.created_at).getTime()) / 86_400_000);
    metrics.push({
      bd_member: owner,
      total_tasks: list.length,
      completed_tasks: done.length,
      completion_rate: percent(done.length, list.length),
      overdue_count: list.filter((t) => t.status === 'Overdue').length,
      avg_completion_time_days: durationsDays.length
        ? Math.round((durationsDays.reduce((a, b) => a + b, 0) / durationsDays.length) * 10) / 10
        : null,
    });
  });
  return metrics.sort((a, b) => b.total_tasks - a.total_tasks || a.bd_member.localeCompare(b.bd_member));
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    if (!db.projects.some((p) => p.id === params.id)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    refreshOverdue();
    const tasks = db.tasks.filter((t) => t.project_id === params.id);
    return NextResponse.json(computeMetrics(tasks));
  } catch (err) {
    console.error('GET /api/projects/[id]/tasks/accountability failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
