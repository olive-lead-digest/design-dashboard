'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, FolderKanban, User } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useToast } from '@/components/common/Toast';
import { PriorityBadge, StatusBadge } from '@/components/common/Badge';
import { api } from '@/lib/api';
import { TASK_PRIORITIES } from '@/lib/constants';
import { displayName, formatDate, isOverdue } from '@/lib/utils';
import type { TaskPriority, TeamTask } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  task: TeamTask | null;
  projectName?: string;
}

export default function TaskDetailModal({ open, onClose, task, projectName }: Props) {
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (open && task) {
      setNotes('');
      setPriority(task.priority);
      setDueDate(task.due_date.slice(0, 10));
    }
  }, [open, task]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tasks'] });
    qc.invalidateQueries({ queryKey: ['accountability'] });
    if (task) qc.invalidateQueries({ queryKey: ['project', task.project_id] });
  };

  const completeMut = useMutation({
    mutationFn: () =>
      api<TeamTask>(`/api/projects/${task!.project_id}/tasks/${task!.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Done', completion_notes: notes.trim() || null }),
      }),
    onSuccess: () => {
      toast('🎉 Task marked as done');
      invalidate();
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Failed to complete task', 'error'),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      api<TeamTask>(`/api/projects/${task!.project_id}/tasks/${task!.id}`, {
        method: 'PUT',
        body: JSON.stringify({ priority, due_date: dueDate }),
      }),
    onSuccess: () => {
      toast('Task updated');
      invalidate();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Failed to update task', 'error'),
  });

  if (!task) return null;
  const overdue = task.status === 'Overdue' || isOverdue(task.due_date, task.status);
  const done = task.status === 'Done';

  return (
    <Modal open={open} onClose={onClose} title="Task Details">
      <div className="space-y-5">
        <div>
          <h3 className="font-heading font-bold text-lg leading-snug">{task.task_title}</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={overdue && !done ? 'Overdue' : task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="badge bg-gray-50 text-gray-500 border-gray-200">{task.task_type}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <p className="flex items-center gap-2 text-gray-600">
            <User size={14} className="text-gray-400 shrink-0" aria-hidden />
            {displayName(task.task_owner_email)}
            <span className="text-gray-400 text-xs truncate">({task.task_owner_email})</span>
          </p>
          <p className={`flex items-center gap-2 ${overdue && !done ? 'text-warning font-semibold' : 'text-gray-600'}`}>
            <CalendarDays size={14} className="shrink-0" aria-hidden />
            Due {formatDate(task.due_date)}
          </p>
          {projectName && (
            <p className="flex items-center gap-2 text-gray-600 sm:col-span-2">
              <FolderKanban size={14} className="text-gray-400 shrink-0" aria-hidden />
              {projectName}
            </p>
          )}
        </div>

        {task.description && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="label mb-1">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{task.description}</p>
          </div>
        )}

        {done ? (
          <div className="rounded-xl bg-success/5 border border-success/20 px-4 py-3">
            <p className="text-sm font-semibold text-success flex items-center gap-1.5">
              <CheckCircle2 size={15} aria-hidden /> Completed {formatDate(task.completed_at)}
            </p>
            {task.completion_notes && <p className="text-sm text-gray-600 mt-1.5">{task.completion_notes}</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end border-t border-gray-100 pt-4">
              <div>
                <label htmlFor="detail-priority" className="label">
                  Priority
                </label>
                <select
                  id="detail-priority"
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <Button
                variant="ghost"
                className="border border-gray-200"
                onClick={() => updateMut.mutate()}
                loading={updateMut.isPending}
              >
                Save Changes
              </Button>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <label htmlFor="completion-notes" className="label">
                  Completion Notes
                </label>
                <textarea
                  id="completion-notes"
                  className="input min-h-[70px] resize-y"
                  placeholder="What was the outcome?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                <Button variant="secondary" onClick={() => completeMut.mutate()} loading={completeMut.isPending}>
                  <CheckCircle2 size={15} /> Mark Done
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
