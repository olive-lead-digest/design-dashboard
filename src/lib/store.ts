// In-memory tester-mode data store (server side). Mutations persist per
// server instance — perfect for $0 testing; production swaps to Supabase.
import type {
  AuditLog, Communication, FeasibilityStudy, FloorPlan,
  InvestmentRequirement, Project, ProjectDocument, Projection, TeamTask,
} from '@/types';
import {
  mockAuditLogs, mockCommunications, mockDocuments, mockFeasibility,
  mockFloorPlans, mockInvestments, mockProjections, mockProjects, mockTasks,
  planLayouts,
} from './mock-data';
import type { PlanLayout } from './floorplan';

export interface Db {
  projects: Project[];
  documents: ProjectDocument[];
  feasibility: FeasibilityStudy[];
  floorPlans: FloorPlan[];
  investments: InvestmentRequirement[];
  communications: Communication[];
  tasks: TeamTask[];
  projections: Projection[];
  auditLogs: AuditLog[];
  layouts: Record<string, PlanLayout>;
}

declare global {
  // eslint-disable-next-line no-var
  var __dd_store: Db | undefined;
}

function seed(): Db {
  return {
    projects: structuredClone(mockProjects),
    documents: structuredClone(mockDocuments),
    feasibility: structuredClone(mockFeasibility),
    floorPlans: structuredClone(mockFloorPlans),
    investments: structuredClone(mockInvestments),
    communications: structuredClone(mockCommunications),
    tasks: structuredClone(mockTasks),
    projections: structuredClone(mockProjections),
    auditLogs: structuredClone(mockAuditLogs),
    layouts: structuredClone(planLayouts),
  };
}

export function getDb(): Db {
  if (!globalThis.__dd_store) globalThis.__dd_store = seed();
  return globalThis.__dd_store;
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function audit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
  getDb().auditLogs.unshift({ ...entry, id: uuid(), timestamp: new Date().toISOString() });
}

/** Recompute Overdue statuses (mirrors n8n Workflow 4 daily check). */
export function refreshOverdue(): void {
  const db = getDb();
  const now = Date.now();
  for (const t of db.tasks) {
    if (t.status !== 'Done' && new Date(t.due_date).getTime() < now) t.status = 'Overdue';
  }
}
