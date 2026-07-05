'use client';

import Link from 'next/link';
import { Clock, Eye, MapPin, Pencil, User } from 'lucide-react';
import type { Project } from '@/types';
import { STATUS_PROGRESS } from '@/lib/constants';
import { StatusBadge } from '@/components/common/Badge';
import { timeAgo } from '@/lib/utils';

interface Props {
  project: Project;
  onEdit?: (p: Project) => void;
}

export default function ProjectCard({ project, onEdit }: Props) {
  const progress = STATUS_PROGRESS[project.status] ?? 0;
  const pulse = project.status === 'Active' || project.status === 'Execution';

  return (
    <div className="card card-hover group relative p-5">
      {/* Stretched link makes the whole card clickable + keyboard focusable */}
      <Link
        href={`/projects/${project.id}`}
        aria-label={`Open project ${project.name}`}
        className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      />

      {/* Quick actions — above the stretched link */}
      <div className="absolute top-3.5 right-3.5 z-[2] flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
        <Link
          href={`/projects/${project.id}`}
          aria-label={`View ${project.name}`}
          className="p-2 rounded-lg bg-white/90 border border-gray-100 shadow-sm text-gray-500 hover:text-secondary hover:border-secondary/40 transition-colors"
        >
          <Eye size={14} />
        </Link>
        {onEdit && (
          <button
            aria-label={`Edit ${project.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(project);
            }}
            className="p-2 rounded-lg bg-white/90 border border-gray-100 shadow-sm text-gray-500 hover:text-secondary hover:border-secondary/40 transition-colors"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="pr-16">
          <h3 className="font-heading font-bold text-[15px] text-primary leading-snug line-clamp-2">{project.name}</h3>
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} className="shrink-0" aria-hidden />
            <span className="truncate">{project.property_location}</span>
            <span className="text-gray-300" aria-hidden>·</span>
            <span className="shrink-0">{project.property_type}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={project.status} pulse={pulse} />
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Clock size={11} aria-hidden /> Updated {timeAgo(project.updated_at)}
          </span>
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate" title="Property owner (stored only — never emailed in tester mode)">
          <User size={12} className="shrink-0 text-gray-400" aria-hidden />
          <span className="truncate">{project.owner_email}</span>
        </p>

        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
            <span>Progress</span>
            <span className="font-semibold text-gray-500">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary to-teal-400 anim-progress"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
