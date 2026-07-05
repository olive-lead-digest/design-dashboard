'use client';

import { CalendarDays, CheckCircle2, FolderKanban } from 'lucide-react';
import type { TeamTask } from '@/types';
import { PriorityBadge } from '@/components/common/Badge';
import { cn, displayName, formatDate, initials, isOverdue } from '@/lib/utils';

interface Props {
  task: TeamTask;
  projectName?: string;
  onOpen: (task: TeamTask) => void;
  onQuickComplete?: (task: TeamTask) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, task: TeamTask) => void;
}

export default function TaskCard({ task, projectName, onOpen, onQuickComplete, onDragStart }: Props) {
  const overdue = task.status === 'Overdue' || isOverdue(task.due_date, task.status);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open task ${task.task_title}`}
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, task) : undefined}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(task);
        }
      }}
      className={cn(
        'card group p-3.5 cursor-pointer select-none space-y-2.5 transition-shadow hover:shadow-lift',
        onDragStart && 'active:cursor-grabbing',
        overdue && task.status !== 'Done' && 'ring-2 ring-warning/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug flex-1">{task.task_title}</p>
        {onQuickComplete && task.status !== 'Done' && (
          <button
            aria-label={`Mark ${task.task_title} complete`}
            title="Mark complete"
            onClick={(e) => {
              e.stopPropagation();
              onQuickComplete(task);
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-300 hover:text-success transition-all shrink-0 rounded-md p-0.5"
          >
            <CheckCircle2 size={17} />
          </button>
        )}
      </div>

      {projectName && (
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/5 text-primary/70 px-1.5 py-0.5 text-[10px] font-semibold max-w-full">
          <FolderKanban size={10} className="shrink-0" aria-hidden />
          <span className="truncate">{projectName}</span>
        </span>
      )}

      <p className="text-[11px] text-gray-400">{task.task_type}</p>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-6 h-6 rounded-full bg-secondary/15 text-secondary text-[9px] font-bold flex items-center justify-center shrink-0"
            aria-hidden
          >
            {initials(task.task_owner_email)}
          </span>
          <span className="text-[11px] text-gray-500 truncate">{displayName(task.task_owner_email)}</span>
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      <p
        className={cn(
          'text-[11px] flex items-center gap-1 font-medium',
          overdue && task.status !== 'Done' ? 'text-warning' : 'text-gray-400',
        )}
      >
        <CalendarDays size={11} aria-hidden />
        Due {formatDate(task.due_date)}
        {overdue && task.status !== 'Done' && <span className="badge bg-warning/10 text-warning border-warning/30 !py-0 !px-1.5 text-[9px]">OVERDUE</span>}
      </p>
    </div>
  );
}
