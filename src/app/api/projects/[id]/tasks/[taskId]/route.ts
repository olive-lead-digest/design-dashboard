// PUT /api/projects/[id]/tasks/[taskId] — update status / notes / priority / due date.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants';
import { getDb } from '@/lib/store';
import { sanitize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string; taskId: string } };

const UpdateTaskSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  completion_notes: z.string().max(2000).nullable().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  due_date: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid due_date')
    .optional(),
});

function zodError(error: z.ZodError): NextResponse {
  const issue = error.issues[0];
  return NextResponse.json(
    { error: `Validation failed — ${issue?.path.join('.') || 'body'}: ${issue?.message ?? 'invalid input'}` },
    { status: 400 },
  );
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    const task = db.tasks.find((t) => t.id === params.taskId && t.project_id === params.id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = UpdateTaskSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const changes: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) {
      task.status = parsed.data.status;
      task.completed_at = parsed.data.status === 'Done' ? new Date().toISOString() : null;
      changes.status = task.status;
      changes.completed_at = task.completed_at;
    }
    if (parsed.data.completion_notes !== undefined) {
      task.completion_notes =
        parsed.data.completion_notes === null ? null : sanitize(parsed.data.completion_notes);
      changes.completion_notes = task.completion_notes;
    }
    if (parsed.data.priority !== undefined) {
      task.priority = parsed.data.priority;
      changes.priority = task.priority;
    }
    if (parsed.data.due_date !== undefined) {
      task.due_date = new Date(parsed.data.due_date).toISOString();
      changes.due_date = task.due_date;
    }

    logAction(session.email, 'update_task', 'team_tasks', task.id, changes);
    return NextResponse.json(task);
  } catch (err) {
    console.error('PUT /api/projects/[id]/tasks/[taskId] failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
