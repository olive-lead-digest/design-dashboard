'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, FolderPlus, LayoutGrid, List, Pencil, Search } from 'lucide-react';
import type { Project } from '@/types';
import { PROJECT_STATUSES, STATUS_PROGRESS } from '@/lib/constants';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/cards/ProjectCard';
import ProjectFormModal from '@/components/modals/ProjectFormModal';
import { StatusBadge } from '@/components/common/Badge';
import { SkeletonGrid } from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import { cn, timeAgo } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Recently updated' },
  { value: 'created_at', label: 'Newest first' },
  { value: 'name', label: 'Name A–Z' },
] as const;

interface Props {
  title?: string;
  /** Show the sort_by select (projects page = full filters). */
  showSort?: boolean;
  /** Show an inline New Project button (hidden on dashboard — FAB covers it). */
  showNewButton?: boolean;
}

export default function ProjectsExplorer({ title = 'Projects', showSort, showNewButton }: Props) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: projects, isLoading, isError, refetch } = useProjects({
    status,
    search: debounced,
    sortBy: showSort ? sortBy : undefined,
  });

  const list = projects ?? [];
  const hasFilters = status !== 'All' || debounced.length > 0;

  return (
    <section aria-label={title}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-heading font-bold text-lg text-primary">{title}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {showSort && (
            <select
              aria-label="Sort projects"
              className="input !w-auto !py-2 text-xs"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden" role="group" aria-label="View mode">
            <button
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              className={cn('p-2.5 transition-colors', view === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50')}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              aria-label="List view"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              className={cn('p-2.5 transition-colors', view === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50')}
            >
              <List size={15} />
            </button>
          </div>
          {showNewButton && (
            <Button variant="secondary" onClick={() => setNewOpen(true)}>
              <FolderPlus size={15} /> New Project
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by status">
          {['All', ...PROJECT_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150',
                status === s
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-ink',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            className="input pl-9"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : isError ? (
        <EmptyState
          title="Couldn't load projects"
          message="Something went wrong while fetching. Please retry."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No projects match your filters' : 'No projects yet'}
          message={
            hasFilters
              ? 'Try a different status or search term.'
              : 'Create your first project to kick off feasibility, plans and owner comms.'
          }
          actionLabel={hasFilters ? 'Clear filters' : 'New Project'}
          onAction={() => {
            if (hasFilters) {
              setStatus('All');
              setSearch('');
            } else {
              setNewOpen(true);
            }
          }}
        />
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={setEditing} />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto anim-fade-in">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="border-b border-gray-100 bg-gray-50/60">
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 w-36">Progress</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="font-semibold text-primary hover:text-secondary transition-colors">
                      {p.name}
                    </Link>
                    <span className="block text-[11px] text-gray-400">{p.property_location}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} pulse={p.status === 'Active' || p.status === 'Execution'} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.property_type}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">{p.owner_email}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{timeAgo(p.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-secondary anim-progress"
                        style={{ width: `${STATUS_PROGRESS[p.status] ?? 0}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/projects/${p.id}`}
                        aria-label={`View ${p.name}`}
                        className="p-2 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                      >
                        <Eye size={14} />
                      </Link>
                      <button
                        aria-label={`Edit ${p.name}`}
                        onClick={() => setEditing(p)}
                        className="p-2 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProjectFormModal open={newOpen} onClose={() => setNewOpen(false)} />
      <ProjectFormModal open={!!editing} onClose={() => setEditing(null)} project={editing} />
    </section>
  );
}
