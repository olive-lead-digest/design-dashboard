'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Communication,
  FeasibilityStudy,
  FloorPlan,
  InvestmentRequirement,
  Project,
  ProjectDocument,
  Projection,
  TeamTask,
} from '@/types';

export interface ProjectDetailBundle {
  project: Project;
  documents: ProjectDocument[];
  feasibility: FeasibilityStudy | null;
  floor_plans: FloorPlan[];
  communications: Communication[];
  tasks: TeamTask[];
  investment: InvestmentRequirement | null;
  projections: Projection[];
}

/** Raw shape is normalized defensively — feasibility/investment may arrive as arrays. */
interface RawBundle extends Omit<ProjectDetailBundle, 'feasibility' | 'investment'> {
  feasibility: FeasibilityStudy | FeasibilityStudy[] | null;
  investment: InvestmentRequirement | InvestmentRequirement[] | null;
}

function first<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: ['project', id],
    enabled: !!id,
    queryFn: async (): Promise<ProjectDetailBundle> => {
      const raw = await api<RawBundle>(`/api/projects/${id}`);
      return {
        ...raw,
        documents: raw.documents ?? [],
        floor_plans: raw.floor_plans ?? [],
        communications: raw.communications ?? [],
        tasks: raw.tasks ?? [],
        projections: raw.projections ?? [],
        feasibility: first(raw.feasibility),
        investment: first(raw.investment),
      };
    },
  });
}
