'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import type { TeamTask } from '@/types';
import { PriorityBadge, StatusBadge } from '@/components/common/Badge';
import { cn, displayName, formatDate, isOverdue } from '@/lib/utils';

type SortKey = 'due_date' | 'priority' | 'status' | 'title';

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
const STATUS_ORDER: Record<string, number> = { Overdue: 0, 'In Progress': 1, 'Not Started': 2, Done: 3 };

interface Props {
  tasks: TeamTask[];
  projectNames?: Record<string, string>;
  onOpen: (task: TeamTask) => void;
}

/** Sortable table view — the kanban's sibling. */
export default function TaskTable({ tasks, projectNames, onOpen }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('due_date');
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const list = [...tasks];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'due_date') cmp = a.due_date.localeCompare(b.due_date);
      else if (sortKey === 'priority') cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      else if (sortKey === 'status') cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      else cmp = a.task_title.localeCompare(b.task_title);
      return asc ? cmp : -cmp;
    });
    return list;
  }, [tasks, sortKey, asc]);

  const header = (key: SortKey, label: string) => (
    <th className="text-left px-4 py-3">
      <button
        onClick={() => {
          if (sortKey === key) setAsc((v) => !v);
          else {
            setSortKey(key);
            setAsc(true);
          }
        }}
        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-gray-500 hover:text-ink transition-colors"
        aria-label={`Sort by ${label}`}
      >
        {label}
        {sortKey === key ? (
          asc ? (
            <ChevronUp size={12} aria-hidden />
          ) : (
            <ChevronDown size={12} aria-hidden />
          )
        ) : (
          <ArrowUpDown size={11} className="text-gray-300" aria-hidden />
        )}
      </button>
    </th>
  );

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="border-b border-gray-100 bg-gray-50/60">
          <tr>
            {header('title', 'Task')}
            {projectNames && <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Project</th>}
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Assignee</th>
            {header('due_date', 'Due')}
            {header('priority', 'Priority')}
            {header('status', 'Status')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => {
            const overdue = t.status === 'Overdue' || isOverdue(t.due_date, t.status);
            return (
              <tr
                key={t.id}
                onClick={() => onOpen(t)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onOpen(t);
                }}
                tabIndex={0}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secondary"
              >
                <td className="px-4 py-3 font-semibold max-w-[260px]">
                  <span className="line-clamp-1">{t.task_title}</span>
                  <span className="block text-[11px] font-normal text-gray-400">{t.task_type}</span>
                </td>
                {projectNames && (
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px]">
                    <span className="line-clamp-1">{projectNames[t.project_id] ?? '—'}</span>
                  </td>
                )}
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{displayName(t.task_owner_email)}</td>
                <td className={cn('px-4 py-3 text-xs whitespace-nowrap', overdue && t.status !== 'Done' ? 'text-warning font-bold' : 'text-gray-600')}>
                  {formatDate(t.due_date)}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={overdue && t.status !== 'Done' ? 'Overdue' : t.status} />
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={projectNames ? 6 : 5} className="px-4 py-10 text-center text-sm text-gray-400">
                No tasks match the current filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
