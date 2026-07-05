// /api/projects/[id]/tasks — GET project tasks · POST create BD task.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { TASK_PRIORITIES } from '@/lib/constants';
import { getDb, refreshOverdue, uuid } from '@/lib/store';
import { sanitize } from '@/lib/utils';
import type { TeamTask } from '@/types';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const CreateTaskSchema = z.object({
  task_owner_email: z
    .string()
    .email('Valid email required')
    .refine((v) => /@oliveliving\.com$/i.test(v.trim()), 'Task owner must be an @oliveliving.com account'),
  task_title: z.string().min(1, 'Title is required').max(200),
  task_type: z.string().min(1, 'Task type is required').max(60),
  due_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid due_date'),
  priority: z.enum(TASK_PRIORITIES),
  description: z.string().max(2000).optional(),
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
    refreshOverdue();
    const tasks = db.tasks
      .filter((t) => t.project_id === params.id)
      .sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date));
    return NextResponse.json(tasks);
  } catch (err) {
    console.error('GET /api/projects/[id]/tasks failed', err);
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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const now = new Date().toISOString();
    const task: TeamTask = {
      id: uuid(),
      project_id: project.id,
      task_owner_email: parsed.data.task_owner_email.trim().toLowerCase(),
      task_title: sanitize(parsed.data.task_title),
      task_type: sanitize(parsed.data.task_type),
      description: parsed.data.description ? sanitize(parsed.data.description) : null,
      due_date: new Date(parsed.data.due_date).toISOString(),
      status: 'Not Started',
      created_at: now,
      completed_at: null,
      priority: parsed.data.priority,
      completion_notes: null,
    };
    db.tasks.push(task);

    logAction(session.email, 'create_task', 'team_tasks', task.id, {
      task_title: task.task_title,
      task_owner_email: task.task_owner_email,
      due_date: task.due_date,
      priority: task.priority,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('POST /api/projects/[id]/tasks failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
