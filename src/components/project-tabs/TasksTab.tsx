'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Kanban, Plus, Table2 } from 'lucide-react';
import type { TaskStatus, TeamTask } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/common/Toast';
import { useAccountability } from '@/hooks/useAccountability';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import TaskTable from '@/components/kanban/TaskTable';
import TaskCreationModal from '@/components/modals/TaskCreationModal';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import { cn, displayName, initials } from '@/lib/utils';

interface Props {
  projectId: string;
  tasks: TeamTask[];
}

export default function TasksTab({ projectId, tasks }: Props) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<TeamTask | null>(null);
  const [overrides, setOverrides] = useState<Record<string, TaskStatus>>({});
  const qc = useQueryClient();
  const { toast } = useToast();
  const accountability = useAccountability(projectId);

  const effectiveTasks = useMemo(
    () =>
      tasks.map((t) => {
        const o = overrides[t.id];
        return o ? { ...t, status: o } : t;
      }),
    [tasks, overrides],
  );

  const clearOverride = (id: string) =>
    setOverrides((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });

  const moveMut = useMutation({
    mutationFn: ({ task, status }: { task: TeamTask; status: TaskStatus }) =>
      api<TeamTask>(`/api/projects/${task.project_id}/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onMutate: ({ task, status }) => setOverrides((o) => ({ ...o, [task.id]: status })),
    onSuccess: (_res, { status }) => toast(`Task moved to ${status}`),
    onError: (e, { task }) => {
      clearOverride(task.id);
      toast(e instanceof Error ? e.message : 'Failed to move task', 'error');
    },
    onSettled: (_res, _err, { task }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] }).then(() => clearOverride(task.id));
      qc.invalidateQueries({ queryKey: ['accountability'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <div className="space-y-5">
      {/* Accountability strip */}
      {accountability.data && accountability.data.length > 0 && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 stagger">
          {accountability.data.map((m) => (
            <div key={m.bd_member} className="card p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
                  {initials(m.bd_member)}
                </span>
                <p className="text-xs font-bold truncate">{displayName(m.bd_member)}</p>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>
                  {m.completed_tasks}/{m.total_tasks} done
                </span>
                <span className="font-bold text-secondary">{m.completion_rate}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-secondary anim-progress" style={{ width: `${m.completion_rate}%` }} />
              </div>
              {m.overdue_count > 0 && (
                <p className="mt-1.5 text-[11px] font-semibold text-warning flex items-center gap-1">
                  <AlertCircle size={11} aria-hidden /> {m.overdue_count} overdue
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden" role="group" aria-label="Tasks view">
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
        <Button variant="secondary" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Add Task
        </Button>
      </div>

      {/* Board / table */}
      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          message="Assign the first BD task for this project."
          actionLabel="Add Task"
          onAction={() => setCreateOpen(true)}
        />
      ) : view === 'kanban' ? (
        <KanbanBoard
          tasks={effectiveTasks}
          onMove={(task, status) => moveMut.mutate({ task, status })}
          onTaskClick={setSelected}
          onQuickComplete={(task) => moveMut.mutate({ task, status: 'Done' })}
        />
      ) : (
        <TaskTable tasks={effectiveTasks} onOpen={setSelected} />
      )}

      <TaskCreationModal open={createOpen} onClose={() => setCreateOpen(false)} projectId={projectId} />
      <TaskDetailModal open={!!selected} onClose={() => setSelected(null)} task={selected} />
    </div>
  );
}
