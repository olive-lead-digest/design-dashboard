'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useToast } from '@/components/common/Toast';
import { api } from '@/lib/api';
import { PROJECT_STATUSES } from '@/lib/constants';
import type { Project, ProjectStatus } from '@/types';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Renovation', 'Co-living'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided the modal edits this project (PUT); otherwise it creates (POST). */
  project?: Project | null;
  onSaved?: (project: Project) => void;
}

interface FormState {
  name: string;
  owner_email: string;
  property_location: string;
  property_type: string;
  description: string;
  status: ProjectStatus;
}

const EMPTY: FormState = {
  name: '',
  owner_email: '',
  property_location: '',
  property_type: 'Residential',
  description: '',
  status: 'Active',
};

export default function ProjectFormModal({ open, onClose, project, onSaved }: Props) {
  const isEdit = !!project;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      project
        ? {
            name: project.name,
            owner_email: project.owner_email,
            property_location: project.property_location,
            property_type: project.property_type,
            description: project.description ?? '',
            status: project.status,
          }
        : EMPTY,
    );
  }, [open, project]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Project name is required';
    if (!isEdit) {
      if (!form.owner_email.trim()) next.owner_email = 'Owner email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.owner_email.trim()))
        next.owner_email = 'Enter a valid email address';
    }
    if (!form.property_location.trim()) next.property_location = 'Location is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (): Promise<Project> => {
      if (isEdit && project) {
        return api<Project>(`/api/projects/${project.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name.trim(),
            status: form.status,
            property_location: form.property_location.trim(),
            description: form.description.trim() || null,
          }),
        });
      }
      return api<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          owner_email: form.owner_email.trim(),
          property_location: form.property_location.trim(),
          property_type: form.property_type,
          description: form.description.trim() || undefined,
        }),
      });
    },
    onSuccess: (saved) => {
      toast(isEdit ? '✅ Project updated' : '✅ Project created');
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      if (isEdit && project) qc.invalidateQueries({ queryKey: ['project', project.id] });
      onSaved?.(saved);
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Something went wrong', 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Project' : 'New Project'}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (validate()) mutation.mutate();
        }}
        noValidate
      >
        <Input
          label="Project Name"
          placeholder="Olive Whitefield Residences"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
        />

        {!isEdit && (
          <div>
            <Input
              label="Owner Email"
              type="email"
              placeholder="owner@example.com"
              value={form.owner_email}
              onChange={(e) => set('owner_email', e.target.value)}
              error={errors.owner_email}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Property owner&apos;s address — stored for records only. In tester mode it is never emailed.
            </p>
          </div>
        )}

        {isEdit && (
          <div>
            <label htmlFor="project-status" className="label">
              Status
            </label>
            <select
              id="project-status"
              className="input"
              value={form.status}
              onChange={(e) => set('status', e.target.value as ProjectStatus)}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Property Location"
          placeholder="Whitefield, Bengaluru, Karnataka"
          value={form.property_location}
          onChange={(e) => set('property_location', e.target.value)}
          error={errors.property_location}
        />

        {!isEdit && (
          <div>
            <label htmlFor="project-type" className="label">
              Property Type
            </label>
            <select
              id="project-type"
              className="input"
              value={form.property_type}
              onChange={(e) => set('property_type', e.target.value)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="project-desc" className="label">
            Description <span className="text-gray-300 normal-case">(optional)</span>
          </label>
          <textarea
            id="project-desc"
            className="input min-h-[88px] resize-y"
            placeholder="Short brief about the asset and scope…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
