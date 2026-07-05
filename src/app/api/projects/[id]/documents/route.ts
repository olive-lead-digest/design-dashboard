// /api/projects/[id]/documents — GET list · POST simulated upload + n8n
// feasibility pipeline (Workflow 2 simulation: auto-extract + auto-generate study).
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAction, requireSession } from '@/lib/auth-server';
import { FILE_CATEGORIES } from '@/lib/constants';
import { triggerWorkflow } from '@/lib/n8n';
import { getDb, uuid } from '@/lib/store';
import { formatINR, sanitize } from '@/lib/utils';
import type {
  CostBreakdown, FeasibilityStudy, FeasibilityTimeline, Project, ProjectDocument, Risk,
} from '@/types';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const UploadSchema = z.object({
  file_name: z.string().min(1, 'file_name is required').max(200),
  document_type: z.enum(['client', 'internal']),
  file_category: z.enum(FILE_CATEGORIES),
});

function zodError(error: z.ZodError): NextResponse {
  const issue = error.issues[0];
  return NextResponse.json(
    { error: `Validation failed — ${issue?.path.join('.') || 'body'}: ${issue?.message ?? 'invalid input'}` },
    { status: 400 },
  );
}

/** Plausible AI-generated feasibility content, scaled by property type (mock-data patterns). */
function buildGeneratedFeasibility(project: Project): FeasibilityStudy {
  const now = new Date().toISOString();
  const type = project.property_type;

  const costBase: Record<string, { construction: number; design: number }> = {
    Residential: { construction: 32_500_000, design: 4_200_000 },
    Commercial: { construction: 18_900_000, design: 2_600_000 },
    Renovation: { construction: 47_500_000, design: 7_100_000 },
    'Co-living': { construction: 27_800_000, design: 3_400_000 },
  };
  const base = costBase[type] ?? { construction: 24_500_000, design: 3_100_000 };
  const contingency = Math.round((base.construction + base.design) * 0.1);
  const total = base.construction + base.design + contingency;
  const cost_breakdown: CostBreakdown = {
    currency: 'INR', land: 0, construction: base.construction, design: base.design, contingency, total,
  };

  const timelines: Record<string, FeasibilityTimeline> = {
    Residential: {
      total_months: 11,
      phases: [
        { name: 'Design Development', months: 2 },
        { name: 'Approvals & Permits', months: 2 },
        { name: 'Civil & MEP', months: 4 },
        { name: 'FF&E + Fit-out', months: 2 },
        { name: 'Pre-opening', months: 1 },
      ],
    },
    Commercial: {
      total_months: 7,
      phases: [
        { name: 'Design & Tenant Mix', months: 2 },
        { name: 'Retrofit & MEP', months: 3 },
        { name: 'Fit-out & Leasing', months: 2 },
      ],
    },
    Renovation: {
      total_months: 9,
      phases: [
        { name: 'Design & Scope Freeze', months: 2 },
        { name: 'Structural & Civil', months: 3 },
        { name: 'Interiors & FF&E', months: 3 },
        { name: 'Handover', months: 1 },
      ],
    },
    'Co-living': {
      total_months: 10,
      phases: [
        { name: 'Design Development', months: 2 },
        { name: 'Approvals & Permits', months: 2 },
        { name: 'Civil & MEP', months: 4 },
        { name: 'Fit-out & Pre-opening', months: 2 },
      ],
    },
  };
  const timeline = timelines[type] ?? {
    total_months: 8,
    phases: [
      { name: 'Design Development', months: 2 },
      { name: 'Approvals & Permits', months: 2 },
      { name: 'Civil & Fit-out', months: 3 },
      { name: 'Pre-opening', months: 1 },
    ],
  };

  const risks: Risk[] = [
    { description: `Local authority approval delays at ${project.property_location}`, impact: 'High', mitigation: 'Pre-submission consultation; retain liaison architect' },
    { description: 'Fit-out procurement lead times (lighting, sanitaryware)', impact: 'Medium', mitigation: 'Order long-lead items at design freeze; domestic alternates listed' },
    { description: 'Monsoon-season slowdown on civil works', impact: 'Medium', mitigation: 'Weather float in the civil phase; waterproofing bundled early' },
    { description: 'Cost escalation on imported FF&E', impact: 'Low', mitigation: 'Fixed-price POs at design freeze; 10% contingency held' },
  ];

  const recommendations = [
    `Freeze GFC drawings by week 6 to protect the ${timeline.total_months}-month timeline`,
    'Procure long-lead FF&E immediately at design freeze',
    `Stage-gate capex releases against ${type} milestone completion`,
    'Bundle waterproofing and structural retrofit into the first civil mobilization',
  ];

  const executive_summary =
    `${project.name} (${type}) at ${project.property_location} is commercially viable with an estimated total outlay of ` +
    `${formatINR(total)} over a ${timeline.total_months}-month program. Diligence is based on the auto-processed document set; ` +
    `the critical path is regulatory approvals and fit-out procurement. (Auto-generated in tester mode — n8n Workflow 2 simulation.)`;

  const detailed_report =
    `# Feasibility Study — ${project.name}\n\n` +
    `## 1. Asset & Market\n${type} asset at ${project.property_location}. Micro-market comparables support the recommended program; demand drivers assessed from the uploaded document set.\n\n` +
    `## 2. Program & Timeline\n${timeline.total_months} months total: ${timeline.phases.map((p) => `${p.name} (${p.months})`).join(' → ')}.\n\n` +
    `## 3. Financial Summary\nTotal outlay ${formatINR(total)} — construction ${formatINR(base.construction)}, design ${formatINR(base.design)}, contingency ${formatINR(contingency)}.\n\n` +
    `## 4. Risks\n${risks.map((r) => `- **${r.impact}** — ${r.description} (Mitigation: ${r.mitigation})`).join('\n')}\n\n` +
    `## 5. Recommendations\n${recommendations.map((r) => `- ${r}`).join('\n')}`;

  return {
    id: uuid(),
    project_id: project.id,
    executive_summary,
    timeline,
    risk_analysis: { risks },
    cost_breakdown,
    recommendations,
    detailed_report,
    status: 'Generated',
    generated_at: now,
    generated_by_ai: true,
    sent_to_owner_at: null,
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = requireSession();
    if ('response' in session) return session.response;

    const db = getDb();
    if (!db.projects.some((p) => p.id === params.id)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const documents = db.documents
      .filter((d) => d.project_id === params.id)
      .sort((a, b) => Date.parse(b.uploaded_at) - Date.parse(a.uploaded_at));
    return NextResponse.json(documents);
  } catch (err) {
    console.error('GET /api/projects/[id]/documents failed', err);
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
    const parsed = UploadSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const now = new Date().toISOString();
    const document: ProjectDocument = {
      id: uuid(),
      project_id: project.id,
      document_type: parsed.data.document_type,
      file_name: sanitize(parsed.data.file_name),
      file_url: null, // tester mode: upload is simulated; production stores a Supabase Storage URL
      file_category: parsed.data.file_category,
      uploaded_by: session.email,
      uploaded_at: now,
      auto_processed: false,
      key_info: null,
    };
    db.documents.push(document);

    // n8n Workflow 2 (feasibility-generator) — no-op simulate in tester mode.
    await triggerWorkflow('feasibility-generator', {
      project_id: project.id,
      document_id: document.id,
      file_name: document.file_name,
    });

    // Simulated pipeline output: auto-extraction + feasibility study.
    document.auto_processed = true;
    document.key_info = { extracted: 'Key terms auto-extracted (tester mode)' };

    const existing = db.feasibility.find((f) => f.project_id === project.id);
    if (!existing) {
      db.feasibility.push(buildGeneratedFeasibility(project));
    } else {
      existing.generated_at = now; // re-run refreshes the study timestamp
    }

    db.communications.push({
      id: uuid(),
      project_id: project.id,
      communication_type: 'status_update',
      subject: 'Feasibility study generated',
      message: `Document "${document.file_name}" was processed and the feasibility study for ${project.name} was ${existing ? 'refreshed' : 'generated'} automatically (tester mode).`,
      sent_by_email: session.email,
      sent_to_owner: false,
      sent_to_owner_at: null,
      owner_read_at: null,
      created_at: now,
      metadata: { related_document_id: document.id },
    });

    logAction(session.email, 'upload_document', 'documents', document.id, {
      file_name: document.file_name,
      file_category: document.file_category,
      document_type: document.document_type,
      generating_feasibility: true,
    });

    return NextResponse.json({ document, generating_feasibility: true }, { status: 201 });
  } catch (err) {
    console.error('POST /api/projects/[id]/documents failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
