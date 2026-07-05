'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  FileText,
  ListChecks,
  PieChart,
  Printer,
  RefreshCw,
  Send,
  Sparkles,
  Timer,
} from 'lucide-react';
import type { EmailPreview, FeasibilityStudy, Project, Risk } from '@/types';
import { api } from '@/lib/api';
import { buildEmailPreview } from '@/lib/email';
import { useToast } from '@/components/common/Toast';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/Badge';
import EmailPreviewModal from '@/components/modals/EmailPreviewModal';
import CostBreakdownChart from '@/components/charts/CostBreakdownChart';
import TimelineChart from '@/components/charts/TimelineChart';
import { cn, formatDate, formatINR } from '@/lib/utils';

interface Props {
  projectId: string;
  project: Project;
  feasibility: FeasibilityStudy | null;
  onJumpDocuments: () => void;
}

export default function FeasibilityTab({ projectId, project, feasibility, onJumpDocuments }: Props) {
  if (!feasibility) {
    return (
      <EmptyState
        title="No feasibility study yet"
        message="Upload documents to auto-generate a feasibility study. Agreements trigger it automatically."
        actionLabel="Upload Documents"
        onAction={onJumpDocuments}
        icon={<FileText size={26} />}
      />
    );
  }
  return <FeasibilityReportViewer projectId={projectId} project={project} study={feasibility} />;
}

/* ================= Report viewer ================= */

function FeasibilityReportViewer({
  projectId,
  project,
  study,
}: {
  projectId: string;
  project: Project;
  study: FeasibilityStudy;
}) {
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const sendMut = useMutation({
    mutationFn: () =>
      api<{ status: string; email_preview: EmailPreview }>(`/api/projects/${projectId}/feasibility/send-to-owner`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      toast('📧 Email preview sent (test mode) — logged to communications');
      setPreview(null);
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Send failed', 'error'),
  });

  const regenMut = useMutation({
    mutationFn: () =>
      api<{ status: string }>(`/api/projects/${projectId}/feasibility/regenerate`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      toast('♻️ Feasibility regeneration started', 'info');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Regeneration failed', 'error'),
  });

  const openPreview = () => {
    setPreview(
      buildEmailPreview({
        subject: `Your ${project.name} — Feasibility Study Ready`,
        projectName: project.name,
        location: project.property_location,
        updateType: 'Feasibility Study',
        summary:
          study.executive_summary?.slice(0, 260) ??
          'The detailed feasibility study for your project is now ready on the dashboard.',
        productionRecipient: project.owner_email,
      }),
    );
  };

  const printPdf = () => {
    toast('🖨 Use your browser dialog to save as PDF', 'info');
    setTimeout(() => window.print(), 350);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="card p-5 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-heading font-bold text-base">Feasibility Study</h3>
            <StatusBadge status={study.status} />
            {study.generated_by_ai && (
              <span className="badge bg-secondary/10 text-secondary border-secondary/30">
                <Sparkles size={11} aria-hidden /> AI generated
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Generated {formatDate(study.generated_at)}
            {study.sent_to_owner_at && ` · Sent to owner ${formatDate(study.sent_to_owner_at)}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" className="!py-2 text-xs" onClick={openPreview}>
            <Send size={13} /> Send to Owner
          </Button>
          <Button
            variant="ghost"
            className="!py-2 text-xs border border-gray-200"
            onClick={() => regenMut.mutate()}
            loading={regenMut.isPending}
          >
            <RefreshCw size={13} /> Regenerate
          </Button>
          <Button variant="ghost" className="!py-2 text-xs border border-gray-200" onClick={printPdf}>
            <Printer size={13} /> Download PDF
          </Button>
        </div>
      </div>

      {/* Expandable sections */}
      <Section title="Executive Summary" icon={<ClipboardList size={15} aria-hidden />} defaultOpen>
        <p className="text-sm text-gray-600 leading-relaxed">{study.executive_summary ?? 'Not available.'}</p>
      </Section>

      {study.timeline && (
        <Section title={`Timeline — ${study.timeline.total_months} months`} icon={<Timer size={15} aria-hidden />} defaultOpen>
          <div className="space-y-4">
            <TimelineChart timeline={study.timeline} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[360px]">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-4">Phase</th>
                    <th className="py-2 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {study.timeline.phases.map((p) => (
                    <tr key={p.name} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                      <td className="py-2.5 text-right text-gray-600">
                        {p.months} month{p.months === 1 ? '' : 's'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {study.risk_analysis && study.risk_analysis.risks.length > 0 && (
        <Section title={`Risk Analysis — ${study.risk_analysis.risks.length} risks`} icon={<AlertTriangle size={15} aria-hidden />}>
          <ul className="space-y-2.5">
            {study.risk_analysis.risks.map((r, i) => (
              <RiskCard key={i} risk={r} index={i} />
            ))}
          </ul>
        </Section>
      )}

      {study.cost_breakdown && (
        <Section title={`Cost Breakdown — ${formatINR(study.cost_breakdown.total)}`} icon={<PieChart size={15} aria-hidden />}>
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <CostBreakdownChart breakdown={study.cost_breakdown} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {(
                    [
                      ['Land', study.cost_breakdown.land],
                      ['Construction', study.cost_breakdown.construction],
                      ['Design', study.cost_breakdown.design],
                      ['Contingency', study.cost_breakdown.contingency],
                    ] as const
                  ).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-50">
                      <td className="py-2.5 text-gray-600">{label}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{formatINR(value)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 font-bold text-primary">Total</td>
                    <td className="py-3 text-right font-bold text-primary tabular-nums">
                      {formatINR(study.cost_breakdown.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {study.recommendations && study.recommendations.length > 0 && (
        <Section title="Recommendations" icon={<ListChecks size={15} aria-hidden />}>
          <ol className="space-y-2.5">
            {study.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                <span className="w-6 h-6 rounded-lg bg-secondary/10 text-secondary text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {study.detailed_report && (
        <Section title="Full Report" icon={<FileText size={15} aria-hidden />}>
          <MiniMarkdown text={study.detailed_report} />
        </Section>
      )}

      <EmailPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        preview={preview}
        onConfirm={() => sendMut.mutate()}
        confirmLoading={sendMut.isPending}
      />
    </div>
  );
}

/* ================= helpers ================= */

function Section({
  title,
  icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors"
      >
        <span className="flex items-center gap-2.5 font-heading font-bold text-sm text-primary">
          <span className="text-secondary">{icon}</span>
          {title}
        </span>
        <ChevronDown size={16} className={cn('text-gray-400 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const IMPACT_CHIP: Record<string, string> = {
  High: 'bg-warning/10 text-warning border-warning/30',
  Medium: 'bg-accent/10 text-accent border-accent/30',
  Low: 'bg-gray-100 text-gray-600 border-gray-300',
};

function RiskCard({ risk, index }: { risk: Risk; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-bold text-gray-400 shrink-0">{index + 1}</span>
        <span className="text-sm font-medium flex-1 leading-snug">{risk.description}</span>
        <span className={cn('badge shrink-0', IMPACT_CHIP[risk.impact] ?? IMPACT_CHIP.Low)}>{risk.impact}</span>
        <ChevronDown size={14} className={cn('text-gray-400 transition-transform shrink-0', open && 'rotate-180')} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-3.5 pl-11 text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-600">Mitigation: </span>
              {risk.mitigation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** Tiny markdown renderer — #/## headings + paragraphs, zero dependencies. */
function MiniMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2.5">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className="font-heading font-bold text-sm text-primary pt-2.5">
              {trimmed.slice(3)}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={i} className="font-heading font-bold text-base text-primary pt-1">
              {trimmed.slice(2)}
            </h2>
          );
        }
        return (
          <p key={i} className="text-sm text-gray-600 leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
