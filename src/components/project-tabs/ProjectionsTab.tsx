'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import type { Projection } from '@/types';
import { useProjections } from '@/hooks/useProjections';
import ProjectionsGrid from '@/components/projections/ProjectionsGrid';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonGrid } from '@/components/common/Loading';

interface Props {
  /** Projections returned in the project detail bundle (may be portfolio-wide). */
  projections: Projection[];
}

/** Scoped, display-only projections view — full actions live on /projections. */
export default function ProjectionsTab({ projections }: Props) {
  const global = useProjections();
  const list = projections.length > 0 ? projections : global.data ?? [];

  if (projections.length === 0 && global.isLoading) {
    return <SkeletonGrid count={4} />;
  }

  if (list.length === 0) {
    return (
      <EmptyState
        title="No projections generated yet"
        message="Head to the Projections page to generate portfolio-level Timeline, Budget, ROI and Risk projections."
        icon={<TrendingUp size={26} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-400">
          Portfolio-level projections (display only). Generate or send from the Projections page.
        </p>
        <Link
          href="/projections"
          className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
        >
          Open Projections <ArrowRight size={12} aria-hidden />
        </Link>
      </div>
      <ProjectionsGrid projections={list} readOnly />
    </div>
  );
}
