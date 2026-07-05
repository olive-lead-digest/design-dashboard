// GET /api/stats — dashboard KPI cards.
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { getDb, refreshOverdue } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    // PRODUCTION: swap to Supabase aggregate queries via getServiceClient().
    refreshOverdue();
    const db = getDb();
    const now = new Date();

    const completed_this_month = db.projects.filter((p) => {
      if (p.status !== 'Complete') return false;
      const u = new Date(p.updated_at);
      return u.getFullYear() === now.getFullYear() && u.getMonth() === now.getMonth();
    }).length;

    return NextResponse.json({
      active_projects: db.projects.filter((p) => p.status !== 'Complete').length,
      feasibility_in_progress: db.projects.filter((p) => p.status === 'Feasibility').length,
      pending_tasks: db.tasks.filter((t) => t.status !== 'Done').length,
      overdue_tasks: db.tasks.filter((t) => t.status === 'Overdue').length,
      completed_this_month,
    });
  } catch (err) {
    console.error('GET /api/stats failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
