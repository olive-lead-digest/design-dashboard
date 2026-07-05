// /api/projects — GET list (filter/search/sort) · POST create
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { PROJECT_STATUSES } from '@/lib/constants';
import { getDb, uuid } from '@/lib/store';
import { sanitize } from '@/lib/utils';
import type { Communication, InvestmentRequirement, Project } from '@/types';

export const dynamic = 'force-dynamic';

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(160),
  owner_email: z.string().email('Valid owner email required'),
  property_location: z.string().min(1, 'Location is required').max(200),
  property_type: z.string().min(1, 'Property type is required').max(60),
  description: z.string().max(2000).optional(),
});

function zodError(error: z.ZodError): NextResponse {
  const issue = error.issues[0];
  return NextResponse.json(
    { error: `Validation failed — ${issue?.path.join('.') || 'body'}: ${issue?.message ?? 'invalid input'}` },
    { status: 400 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    // PRODUCTION: replace with a Supabase query (getServiceClient()) — same filters.
    const db = getDb();
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim().toLowerCase() ?? '';
    const sortBy = searchParams.get('sort_by') ?? 'updated_at';

    if (status && !(PROJECT_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: `Invalid status filter. Use one of: ${PROJECT_STATUSES.join(', ')}` }, { status: 400 });
    }

    let projects = [...db.projects];
    if (status) projects = projects.filter((p) => p.status === status);
    if (search) {
      projects = projects.filter(
        (p) => p.name.toLowerCase().includes(search) || p.property_location.toLowerCase().includes(search),
      );
    }
    if (sortBy === 'name') projects.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'created_at') projects.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    else projects.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)); // default: updated_at

    return NextResponse.json(projects);
  } catch (err) {
    console.error('GET /api/projects failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = CreateProjectSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const db = getDb();
    const now = new Date().toISOString();
    const project: Project = {
      id: uuid(),
      name: sanitize(parsed.data.name),
      status: 'Active',
      // Stored for the production audit trail ONLY — never emailed in tester mode.
      owner_email: parsed.data.owner_email.trim(),
      property_location: sanitize(parsed.data.property_location),
      property_type: sanitize(parsed.data.property_type),
      description: parsed.data.description ? sanitize(parsed.data.description) : null,
      created_at: now,
      updated_at: now,
    };
    db.projects.push(project);

    // Empty investment requirements shell (filled in later from the project page).
    const investment: InvestmentRequirement = {
      id: uuid(),
      project_id: project.id,
      total_investment: 0,
      currency: 'INR',
      breakdown: { currency: 'INR', land: 0, construction: 0, design: 0, contingency: 0, total: 0 },
      estimated_roi_percent: null,
      payment_schedule: [],
      updated_at: now,
      approved_by_owner: false,
    };
    db.investments.push(investment);

    // Welcome communication (internal log — nothing is emailed).
    const welcome: Communication = {
      id: uuid(),
      project_id: project.id,
      communication_type: 'status_update',
      subject: 'Welcome to Olive Living — Project Created',
      message: `${project.name} has been onboarded. Our BD team will begin document collection; the feasibility study is generated automatically once documents are uploaded.`,
      sent_by_email: session.email,
      sent_to_owner: false,
      sent_to_owner_at: null,
      owner_read_at: null,
      created_at: now,
      metadata: null,
    };
    db.communications.push(welcome);

    logAction(session.email, 'create_project', 'projects', project.id, {
      name: project.name,
      property_type: project.property_type,
      property_location: project.property_location,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error('POST /api/projects failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
