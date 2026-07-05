'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, CircleDashed } from 'lucide-react';
import type { TaskStatus, TeamTask } from '@/types';
import TaskCard from '@/components/cards/TaskCard';
import { cn } from '@/lib/utils';

export type KanbanColumnKey = 'Not Started' | 'In Progress' | 'Done';

const COLUMNS: { key: KanbanColumnKey; icon: React.ReactNode; accent: string }[] = [
  { key: 'Not Started', icon: <CircleDashed size={14} aria-hidden />, accent: 'text-gray-400' },
  { key: 'In Progress', icon: <Circle size={14} aria-hidden />, accent: 'text-blue-500' },
  { key: 'Done', icon: <CheckCircle2 size={14} aria-hidden />, accent: 'text-success' },
];

/** Overdue tasks stay in their working column (with a red ring on the card). */
export function bucketOf(task: TeamTask): KanbanColumnKey {
  if (task.status === 'Done') return 'Done';
  if (task.status === 'Not Started') return 'Not Started';
  return 'In Progress'; // 'In Progress' + 'Overdue'
}

interface Props {
  tasks: TeamTask[];
  onMove: (task: TeamTask, status: TaskStatus) => void;
  onTaskClick: (task: TeamTask) => void;
  /** project_id → name, shows a project chip on cards (global board). */
  projectNames?: Record<string, string>;
  onQuickComplete?: (task: TeamTask) => void;
}

/** Reusable 3-column HTML5 drag & drop kanban with framer-motion reflow. */
export default function KanbanBoard({ tasks, onMove, onTaskClick, projectNames, onQuickComplete }: Props) {
  const [dragOver, setDragOver] = useState<KanbanColumnKey | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, col: KanbanColumnKey) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t.id === id);
    if (task && bucketOf(task) !== col) onMove(task, col);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => bucketOf(t) === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOver(col.key);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
            }}
            onDrop={(e) => handleDrop(e, col.key)}
            className={cn(
              'rounded-2xl border-2 border-dashed p-3 min-h-[280px] transition-colors duration-200 bg-gray-50/60',
              dragOver === col.key ? 'border-secondary bg-secondary/5' : 'border-transparent',
            )}
            aria-label={`${col.key} column, ${colTasks.length} tasks`}
          >
            <div className="flex items-center gap-2 px-1 mb-3">
              <span className={col.accent}>{col.icon}</span>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">{col.key}</h3>
              <span className="ml-auto badge bg-white text-gray-500 border-gray-200 !text-[10px]">{colTasks.length}</span>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {colTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskCard
                      task={task}
                      projectName={projectNames?.[task.project_id]}
                      onOpen={onTaskClick}
                      onQuickComplete={onQuickComplete}
                      onDragStart={(e, tk) => {
                        e.dataTransfer.setData('text/plain', tk.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {colTasks.length === 0 && (
                <p className="text-xs text-gray-300 text-center py-8 select-none">
                  {dragOver === col.key ? 'Drop here' : 'No tasks'}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
