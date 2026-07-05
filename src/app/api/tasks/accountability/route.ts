// GET /api/tasks/accountability — global per-BD-member metrics across all projects
// (mirrors n8n Workflow 4 accountability rollup).
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { getDb, refreshOverdue } from '@/lib/store';
import { percent } from '@/lib/utils';
import type { AccountabilityMetric, TeamTask } from '@/types';

export const dynamic = 'force-dynamic';

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

export async function GET() {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    refreshOverdue();
    return NextResponse.json(computeMetrics(getDb().tasks));
  } catch (err) {
    console.error('GET /api/tasks/accountability failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
