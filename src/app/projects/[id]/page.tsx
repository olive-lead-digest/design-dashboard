'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarClock, IndianRupee, MapPin, Pencil, Percent, TrendingUp, User } from 'lucide-react';
import Shell from '@/components/layout/Shell';
import { useProjectDetail } from '@/hooks/useProjectDetail';
import { PageLoader } from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import ProjectFormModal from '@/components/modals/ProjectFormModal';
import OverviewTab from '@/components/project-tabs/OverviewTab';
import DocumentsTab from '@/components/project-tabs/DocumentsTab';
import FeasibilityTab from '@/components/project-tabs/FeasibilityTab';
import FloorPlansTab from '@/components/project-tabs/FloorPlansTab';
import CommunicationsTab from '@/components/project-tabs/CommunicationsTab';
import TasksTab from '@/components/project-tabs/TasksTab';
import InvestmentTab from '@/components/project-tabs/InvestmentTab';
import ProjectionsTab from '@/components/project-tabs/ProjectionsTab';
import { STATUS_PROGRESS } from '@/lib/constants';
import { cn, formatCurrency } from '@/lib/utils';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'feasibility', label: 'Feasibility Study' },
  { id: 'floorplans', label: 'Floor Plans' },
  { id: 'communications', label: 'Communications' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'investment', label: 'Investment' },
  { id: 'projections', label: 'Projections' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const initialTab = (search.get('tab') as TabId) || 'overview';
  const [tab, setTab] = useState<TabId>(TABS.some((t) => t.id === initialTab) ? initialTab : 'overview');
  const [editOpen, setEditOpen] = useState(false);

  const { data: bundle, isLoading, isError, error } = useProjectDetail(params.id);

  const daysInProgress = useMemo(() => {
    if (!bundle) return 0;
    return Math.max(1, Math.floor((Date.now() - new Date(bundle.project.created_at).getTime()) / 86_400_000));
  }, [bundle]);

  const jump = (t: string) => {
    if (TABS.some((x) => x.id === t)) setTab(t as TabId);
  };

  return (
    <Shell>
      {isLoading && <PageLoader label="Loading project…" />}

      {isError && (
        <EmptyState
          title="Project not found"
          message={error instanceof Error ? error.message : 'This project may have been removed.'}
          actionLabel="Back to Projects"
          onAction={() => router.push('/projects')}
        />
      )}

      {bundle && (
        <div className="space-y-6">
          {/* ---------- header ---------- */}
          <div className="anim-fade-slide-up">
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-secondary transition-colors mb-3">
              <ArrowLeft size={15} /> All projects
            </Link>
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-primary truncate">{bundle.project.name}</h1>
                  <StatusBadge status={bundle.project.status} pulse={bundle.project.status === 'Active' || bundle.project.status === 'Execution'} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden /> {bundle.project.property_location}</span>
                  <span>· {bundle.project.property_type}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs" title="Property owner (production recipient — never emailed in tester mode)">
                    <User size={11} aria-hidden /> {bundle.project.owner_email}
                  </span>
                </div>
              </div>
              <Button variant="ghost" className="border border-gray-200" onClick={() => setEditOpen(true)}>
                <Pencil size={14} /> Edit
              </Button>
            </div>
          </div>

          {/* ---------- quick stats ---------- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
            <StatChip icon={<CalendarClock size={16} aria-hidden />} label="Days in progress" value={`${daysInProgress}`} />
            <StatChip
              icon={<TrendingUp size={16} aria-hidden />}
              label="% complete"
              value={`${STATUS_PROGRESS[bundle.project.status] ?? 0}%`}
              bar={STATUS_PROGRESS[bundle.project.status] ?? 0}
            />
            <StatChip
              icon={<IndianRupee size={16} aria-hidden />}
              label="Investment"
              value={bundle.investment && bundle.investment.total_investment > 0 ? formatCurrency(bundle.investment.total_investment, bundle.investment.currency) : '—'}
            />
            <StatChip
              icon={<Percent size={16} aria-hidden />}
              label="Est. ROI"
              value={bundle.investment?.estimated_roi_percent != null ? `${bundle.investment.estimated_roi_percent}%` : '—'}
            />
          </div>

          {/* ---------- tabs ---------- */}
          <div className="border-b border-gray-200 -mx-1 overflow-x-auto">
            <div className="flex gap-1 px-1 min-w-max" role="tablist" aria-label="Project sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                    tab === t.id ? 'text-secondary' : 'text-gray-500 hover:text-ink',
                  )}
                >
                  {t.label}
                  {tab === t.id && <motion.span layoutId="project-tab-underline" className="absolute inset-x-2 bottom-0 h-0.5 bg-secondary rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} role="tabpanel">
            {tab === 'overview' && <OverviewTab bundle={bundle} onEdit={() => setEditOpen(true)} onJump={jump} />}
            {tab === 'documents' && <DocumentsTab projectId={bundle.project.id} documents={bundle.documents} />}
            {tab === 'feasibility' && (
              <FeasibilityTab projectId={bundle.project.id} project={bundle.project} feasibility={bundle.feasibility} onJumpDocuments={() => jump('documents')} />
            )}
            {tab === 'floorplans' && <FloorPlansTab projectId={bundle.project.id} project={bundle.project} plans={bundle.floor_plans} />}
            {tab === 'communications' && <CommunicationsTab projectId={bundle.project.id} project={bundle.project} communications={bundle.communications} />}
            {tab === 'tasks' && <TasksTab projectId={bundle.project.id} tasks={bundle.tasks} />}
            {tab === 'investment' && <InvestmentTab projectId={bundle.project.id} investment={bundle.investment} />}
            {tab === 'projections' && <ProjectionsTab projections={bundle.projections} />}
          </motion.div>

          <ProjectFormModal open={editOpen} onClose={() => setEditOpen(false)} project={bundle.project} />
        </div>
      )}
    </Shell>
  );
}

function StatChip({ icon, label, value, bar }: { icon: React.ReactNode; label: string; value: string; bar?: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wide">
        <span className="text-secondary">{icon}</span> {label}
      </div>
      <p className="mt-1.5 text-xl font-bold text-primary">{value}</p>
      {bar != null && (
        <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-secondary anim-progress" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}
