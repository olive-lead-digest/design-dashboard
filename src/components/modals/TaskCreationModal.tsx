'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useToast } from '@/components/common/Toast';
import { api } from '@/lib/api';
import { BD_TEAM, TASK_PRIORITIES, TASK_TYPES } from '@/lib/constants';
import { displayName } from '@/lib/utils';
import type { TaskPriority, TeamTask } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set, posts to the project-scoped endpoint. */
  projectId?: string;
  /** For the global tasks page — enables a project select and posts to /api/tasks. */
  projects?: { id: string; name: string }[];
  onCreated?: (task: TeamTask) => void;
}

export default function TaskCreationModal({ open, onClose, projectId, projects, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>(TASK_TYPES[0]);
  const [assignee, setAssignee] = useState<string>(BD_TEAM[0]);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string; project?: string }>({});
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setType(TASK_TYPES[0]);
    setAssignee(BD_TEAM[0]);
    setDueDate(new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
    setPriority('Medium');
    setDescription('');
    setSelectedProject(projects?.[0]?.id ?? '');
    setErrors({});
  }, [open, projects]);

  const mutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        task_title: title.trim(),
        task_type: type,
        task_owner_email: assignee,
        due_date: dueDate,
        priority,
        description: description.trim() || null,
      };
      if (projectId) {
        return api<TeamTask>(`/api/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) });
      }
      return api<TeamTask>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ ...body, project_id: selectedProject }),
      });
    },
    onSuccess: (task) => {
      toast('✅ Task created and assigned');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['accountability'] });
      if (projectId) qc.invalidateQueries({ queryKey: ['project', projectId] });
      if (!projectId && selectedProject) qc.invalidateQueries({ queryKey: ['project', selectedProject] });
      onCreated?.(task);
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Failed to create task', 'error'),
  });

  const submit = () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = 'Task title is required';
    if (!dueDate) next.dueDate = 'Due date is required';
    if (!projectId && !selectedProject) next.project = 'Select a project';
    setErrors(next);
    if (Object.keys(next).length === 0) mutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Task">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Input
          label="Task Title"
          placeholder="Collect title deed chain from owner counsel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        {!projectId && projects && (
          <div>
            <label htmlFor="task-project" className="label">
              Project
            </label>
            <select
              id="task-project"
              className="input"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-invalid={!!errors.project}
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.project && (
              <p className="mt-1 text-xs text-warning font-medium" role="alert">
                {errors.project}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-type" className="label">
              Task Type
            </label>
            <select id="task-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-assignee" className="label">
              Assignee (BD Team)
            </label>
            <select id="task-assignee" className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {BD_TEAM.map((m) => (
                <option key={m} value={m}>
                  {displayName(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            error={errors.dueDate}
          />
          <div>
            <label htmlFor="task-priority" className="label">
              Priority
            </label>
            <select
              id="task-priority"
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
        </div>

        <div>
          <label htmlFor="task-desc" className="label">
            Description <span className="text-gray-300 normal-case">(optional)</span>
          </label>
          <textarea
            id="task-desc"
            className="input min-h-[80px] resize-y"
            placeholder="Context, links, expectations…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={mutation.isPending}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
