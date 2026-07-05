// /api/projects/[id]/investment — GET requirements · PUT full update.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { getDb } from '@/lib/store';
import { sanitize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const BreakdownSchema = z.object({
  currency: z.string().min(1).max(8),
  land: z.number().min(0),
  construction: z.number().min(0),
  design: z.number().min(0),
  contingency: z.number().min(0),
  total: z.number().min(0),
});

const UpdateInvestmentSchema = z.object({
  total_investment: z.number().min(0),
  currency: z.enum(['INR', 'USD']),
  breakdown: BreakdownSchema,
  estimated_roi_percent: z.number().nullable().optional(),
  payment_schedule: z.array(
    z.object({
      phase: z.string().min(1).max(120),
      amount: z.number().min(0),
      date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
    }),
  ),
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
    const investment = db.investments.find((i) => i.project_id === params.id);
    if (!investment) return NextResponse.json({ error: 'No investment requirements yet' }, { status: 404 });
    return NextResponse.json(investment);
  } catch (err) {
    console.error('GET /api/projects/[id]/investment failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    if (!db.projects.some((p) => p.id === params.id)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const investment = db.investments.find((i) => i.project_id === params.id);
    if (!investment) return NextResponse.json({ error: 'No investment requirements yet' }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = UpdateInvestmentSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    investment.total_investment = parsed.data.total_investment;
    investment.currency = parsed.data.currency;
    investment.breakdown = parsed.data.breakdown;
    investment.estimated_roi_percent = parsed.data.estimated_roi_percent ?? null;
    investment.payment_schedule = parsed.data.payment_schedule.map((p) => ({
      phase: sanitize(p.phase),
      amount: p.amount,
      date: p.date,
    }));
    investment.updated_at = new Date().toISOString();

    logAction(session.email, 'update_investment', 'investment_requirements', investment.id, {
      total_investment: investment.total_investment,
      currency: investment.currency,
      estimated_roi_percent: investment.estimated_roi_percent,
      payment_phases: investment.payment_schedule.length,
    });

    return NextResponse.json(investment);
  } catch (err) {
    console.error('PUT /api/projects/[id]/investment failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
