'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Bell, Check, FileText, Mail, Pencil, RefreshCw, Ruler, Send } from 'lucide-react';
import type { Communication } from '@/types';
import type { ProjectDetailBundle } from '@/hooks/useProjectDetail';
import { PROJECT_STATUSES } from '@/lib/constants';
import { api } from '@/lib/api';
import { useToast } from '@/components/common/Toast';
import { cn, timeAgo } from '@/lib/utils';

const COMM_ICONS: Record<string, React.ReactNode> = {
  feasibility_sent: <FileText size={14} aria-hidden />,
  floor_plan_sent: <Ruler size={14} aria-hidden />,
  status_update: <Activity size={14} aria-hidden />,
  email: <Mail size={14} aria-hidden />,
  dashboard_notification: <Bell size={14} aria-hidden />,
};

interface Props {
  bundle: ProjectDetailBundle;
  onEdit: () => void;
  onJump: (tab: string) => void;
}

export default function OverviewTab({ bundle, onEdit, onJump }: Props) {
  const { project, communications } = bundle;
  const qc = useQueryClient();
  const { toast } = useToast();
  const currentIdx = PROJECT_STATUSES.indexOf(project.status);

  const regenerate = useMutation({
    mutationFn: () =>
      api<{ status: string }>(`/api/projects/${project.id}/feasibility/regenerate`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      toast('♻️ Feasibility regeneration started — refreshing shortly', 'info');
      qc.invalidateQueries({ queryKey: ['project', project.id] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Regeneration failed', 'error'),
  });

  const recent = [...communications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Status timeline stepper */}
      <div className="card p-6">
        <h3 className="font-heading font-bold text-sm mb-6">Project Phase</h3>
        <ol className="flex items-start" aria-label="Project phase timeline">
          {PROJECT_STATUSES.map((phase, i) => {
            const done = i < currentIdx;
            const current = i === currentIdx;
            return (
              <li key={phase} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2',
                      i <= currentIdx ? 'bg-secondary' : 'bg-gray-200',
                    )}
                  />
                )}
                <span
                  className={cn(
                    'relative z-[1] w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                    done && 'bg-secondary border-secondary text-white',
                    current && 'bg-white border-secondary text-secondary anim-badge-pulse',
                    !done && !current && 'bg-white border-gray-200 text-gray-300',
                  )}
                >
                  {done ? <Check size={14} aria-label={`${phase} complete`} /> : i + 1}
                </span>
                <span
                  className={cn(
                    'mt-2 text-[10px] sm:text-[11px] font-semibold text-center leading-tight px-0.5',
                    current ? 'text-secondary' : done ? 'text-gray-600' : 'text-gray-300',
                  )}
                >
                  {phase}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <div className="card p-6">
          <h3 className="font-heading font-bold text-sm mb-4">Recent Activity</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No activity yet</p>
          ) : (
            <ul className="space-y-4">
              {recent.map((c: Communication) => (
                <li key={c.id} className="flex gap-3">
                  <span
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      c.sent_to_owner ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {COMM_ICONS[c.communication_type] ?? <Mail size={14} aria-hidden />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug line-clamp-1">{c.subject ?? 'Update'}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{c.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {timeAgo(c.created_at)}
                      {c.sent_to_owner && <span className="text-secondary font-semibold ml-2">✓ Sent to owner</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h3 className="font-heading font-bold text-sm mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={onEdit} className="btn-ghost border border-gray-200 justify-start !py-3">
              <Pencil size={15} className="text-gray-400" /> Edit Project
            </button>
            <button
              onClick={() => regenerate.mutate()}
              disabled={regenerate.isPending}
              className="btn-ghost border border-gray-200 justify-start !py-3"
            >
              <RefreshCw size={15} className={cn('text-gray-400', regenerate.isPending && 'animate-spin')} />
              Regenerate Feasibility
            </button>
            <button onClick={() => onJump('floorplans')} className="btn-ghost border border-gray-200 justify-start !py-3">
              <Ruler size={15} className="text-gray-400" /> Generate Plans
            </button>
            <button onClick={() => onJump('communications')} className="btn-ghost border border-gray-200 justify-start !py-3">
              <Send size={15} className="text-gray-400" /> Send to Owner
            </button>
          </div>

          {project.description && (
            <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="label mb-1">About</p>
              <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
