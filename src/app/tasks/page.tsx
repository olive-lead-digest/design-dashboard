'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Clock3, Kanban, Plus, Search, Table2, TrendingDown, TrendingUp } from 'lucide-react';
import Shell from '@/components/layout/Shell';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { PageLoader } from '@/components/common/Loading';
import { useToast } from '@/components/common/Toast';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import TaskTable from '@/components/kanban/TaskTable';
import TaskCreationModal from '@/components/modals/TaskCreationModal';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import { useAllTasks } from '@/hooks/useAllTasks';
import { useAccountability } from '@/hooks/useAccountability';
import { api } from '@/lib/api';
import { BD_TEAM, TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants';
import { cn, displayName, initials } from '@/lib/utils';
import type { TaskStatus, TeamTask } from '@/types';

export default function BDTaskBoardPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [member, setMember] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<TeamTask | null>(null);
  const [overrides, setOverrides] = useState<Record<string, TaskStatus>>({});

  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useAllTasks();
  const accountability = useAccountability();

  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of data?.projects ?? []) map[p.id] = p.name;
    return map;
  }, [data]);

  const filtered = useMemo(() => {
    let list = (data?.tasks ?? []).map((t) => (overrides[t.id] ? { ...t, status: overrides[t.id] } : t));
    if (member !== 'All') list = list.filter((t) => t.task_owner_email === member);
    if (projectFilter !== 'All') list = list.filter((t) => t.project_id === projectFilter);
    if (priority !== 'All') list = list.filter((t) => t.priority === priority);
    if (status !== 'All') list = list.filter((t) => t.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.task_title.toLowerCase().includes(q) || (projectNames[t.project_id] ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [data, overrides, member, projectFilter, priority, status, search, projectNames]);

  const clearOverride = (id: string) =>
    setOverrides((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });

  const moveMut = useMutation({
    mutationFn: ({ task, status: next }: { task: TeamTask; status: TaskStatus }) =>
      api<TeamTask>(`/api/projects/${task.project_id}/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: next }),
      }),
    onMutate: ({ task, status: next }) => setOverrides((o) => ({ ...o, [task.id]: next })),
    onSuccess: (_r, { status: next }) => toast(`Task moved to ${next}`),
    onError: (e, { task }) => {
      clearOverride(task.id);
      toast(e instanceof Error ? e.message : 'Failed to move task', 'error');
    },
    onSettled: (_r, _e, { task }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] }).then(() => clearOverride(task.id));
      qc.invalidateQueries({ queryKey: ['accountability'] });
    },
  });

  return (
    <Shell>
      <div className="space-y-6">
        <div className="anim-fade-slide-up">
          <h1 className="text-2xl font-bold text-primary">BD Team Accountability Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Who owns what, what&rsquo;s overdue, and how each member is tracking.</p>
        </div>

        {/* ---------- accountability metric cards ---------- */}
        {accountability.data && accountability.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
            {accountability.data.map((m) => {
              const improving = m.completion_rate >= 70;
              return (
                <div key={m.bd_member} className="card card-hover p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {initials(m.bd_member)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{displayName(m.bd_member)}</p>
                      <p className="text-[11px] text-gray-400 truncate">{m.bd_member}</p>
                    </div>
                    <span className={cn('ml-auto', improving ? 'text-success' : 'text-warning')} title={improving ? 'On track' : 'Needs attention'}>
                      {improving ? <TrendingUp size={16} aria-label="Trending up" /> : <TrendingDown size={16} aria-label="Trending down" />}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mb-1.5">
                    <p className="text-2xl font-bold text-primary">{m.completion_rate}%</p>
                    <p className="text-[11px] text-gray-400">
                      {m.completed_tasks}/{m.total_tasks} tasks
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full anim-progress', improving ? 'bg-secondary' : 'bg-accent')}
                      style={{ width: `${m.completion_rate}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className={cn('inline-flex items-center gap-1 font-semibold', m.overdue_count > 0 ? 'text-warning' : 'text-gray-400')}>
                      <AlertCircle size={11} aria-hidden /> {m.overdue_count} overdue
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-400">
                      <Clock3 size={11} aria-hidden /> avg {m.avg_completion_time_days != null ? `${m.avg_completion_time_days}d` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------- toolbar ---------- */}
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden" role="group" aria-label="View">
            <button
              aria-label="Kanban view"
              aria-pressed={view === 'kanban'}
              onClick={() => setView('kanban')}
              className={cn('p-2.5 transition-colors', view === 'kanban' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50')}
            >
              <Kanban size={15} />
            </button>
            <button
              aria-label="Table view"
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
              className={cn('p-2.5 transition-colors', view === 'table' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50')}
            >
              <Table2 size={15} />
            </button>
          </div>

          <label className="sr-only" htmlFor="task-search">Search tasks</label>
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
            <input id="task-search" className="input pl-9" placeholder="Search tasks or projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <select aria-label="Filter by member" className="input w-auto" value={member} onChange={(e) => setMember(e.target.value)}>
            <option value="All">All members</option>
            {BD_TEAM.map((m) => (
              <option key={m} value={m}>{displayName(m)}</option>
            ))}
          </select>
          <select aria-label="Filter by project" className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="All">All projects</option>
            {(data?.projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select aria-label="Filter by priority" className="input w-auto" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="All">All priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select aria-label="Filter by status" className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> New Task
          </Button>
        </div>

        {/* ---------- board / table ---------- */}
        {isLoading ? (
          <PageLoader label="Loading tasks…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No tasks match"
            message="Adjust the filters, or create a new BD task."
            actionLabel="New Task"
            onAction={() => setCreateOpen(true)}
          />
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={filtered}
            projectNames={projectNames}
            onMove={(task, next) => moveMut.mutate({ task, status: next })}
            onTaskClick={setSelected}
            onQuickComplete={(task) => moveMut.mutate({ task, status: 'Done' })}
          />
        ) : (
          <TaskTable tasks={filtered} projectNames={projectNames} onOpen={setSelected} />
        )}

        <TaskCreationModal open={createOpen} onClose={() => setCreateOpen(false)} projects={data?.projects ?? []} />
        <TaskDetailModal
          open={!!selected}
          onClose={() => setSelected(null)}
          task={selected}
          projectName={selected ? projectNames[selected.project_id] : undefined}
        />
      </div>
    </Shell>
  );
}
