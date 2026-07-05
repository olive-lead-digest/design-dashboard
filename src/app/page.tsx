'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  FileSearch,
  FolderPlus,
  ListTodo,
  Plus,
  Ruler,
  Send,
  TrendingUp,
  X,
} from 'lucide-react';
import Shell from '@/components/layout/Shell';
import KPICard from '@/components/cards/KPICard';
import ProjectsExplorer from '@/components/projects/ProjectsExplorer';
import ProjectFormModal from '@/components/modals/ProjectFormModal';
import { useStats } from '@/hooks/useStats';

export default function DashboardPage() {
  return (
    <Shell>
      <div className="space-y-8">
        <StatsRow />
        <ProjectsExplorer title="Projects" />
      </div>
      <FloatingActions />
    </Shell>
  );
}

/* ================= KPI row ================= */

function StatsRow() {
  const { data: stats, isLoading } = useStats();

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-8 w-1/3" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
      <KPICard
        icon={Building2}
        label="Active Projects"
        value={stats.active_projects}
        iconClass="bg-secondary/10 text-secondary"
        sub={
          <>
            <TrendingUp size={12} className="text-success" aria-hidden />
            Across the portfolio
          </>
        }
      />
      <KPICard
        icon={FileSearch}
        label="Feasibility In Progress"
        value={stats.feasibility_in_progress}
        iconClass="bg-accent/10 text-accent"
        sub={<>Studies being prepared</>}
      />
      <KPICard
        icon={ListTodo}
        label="Pending BD Tasks"
        value={stats.pending_tasks}
        iconClass="bg-blue-100 text-blue-600"
        sub={
          stats.overdue_tasks > 0 ? (
            <span className="badge bg-warning/10 text-warning border-warning/30 !text-[10px]">
              {stats.overdue_tasks} overdue
            </span>
          ) : (
            <>All on schedule</>
          )
        }
      />
      <KPICard
        icon={CheckCircle2}
        label="Completed This Month"
        value={stats.completed_this_month}
        iconClass="bg-success/10 text-success"
        sub={
          <>
            <TrendingUp size={12} className="text-success" aria-hidden />
            Tasks closed by BD team
          </>
        }
      />
    </div>
  );
}

/* ================= Floating action button ================= */

function FloatingActions() {
  const [open, setOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const actions = [
    {
      label: 'New Project',
      icon: <FolderPlus size={16} aria-hidden />,
      onClick: () => {
        setOpen(false);
        setNewProjectOpen(true);
      },
    },
    {
      label: 'Generate Floor Plan',
      icon: <Ruler size={16} aria-hidden />,
      onClick: () => {
        setOpen(false);
        router.push('/projects');
      },
    },
    {
      label: 'Send Communication',
      icon: <Send size={16} aria-hidden />,
      onClick: () => {
        setOpen(false);
        router.push('/projects');
      },
    },
    {
      label: 'View Projections',
      icon: <TrendingUp size={16} aria-hidden />,
      onClick: () => {
        setOpen(false);
        router.push('/projections');
      },
    },
  ];

  return (
    <>
      {/* click-away overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-primary/10 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-end gap-2"
              role="menu"
              aria-label="Quick actions"
            >
              {actions.map((a) => (
                <li key={a.label} role="none">
                  <button
                    role="menuitem"
                    onClick={a.onClick}
                    className="card card-hover flex items-center gap-2.5 pl-4 pr-5 py-3 text-sm font-semibold text-primary"
                  >
                    <span className="text-secondary">{a.icon}</span>
                    {a.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={open ? 'Close quick actions' : 'Open quick actions'}
          className="relative w-14 h-14 rounded-full bg-secondary text-white shadow-lift flex items-center justify-center
            hover:bg-secondary/90 active:scale-95 transition-all duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          {!open && <span className="absolute inset-0 rounded-full bg-secondary/40 animate-ping" aria-hidden />}
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }} className="relative">
            {open ? <X size={22} aria-hidden /> : <Plus size={24} aria-hidden />}
          </motion.span>
        </button>
      </div>

      <ProjectFormModal open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />
    </>
  );
}
