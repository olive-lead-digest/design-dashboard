'use client';

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarDays, Download, Printer, Send, ShieldAlert, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { Projection } from '@/types';
import Button from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import RiskHeatMap, { type HeatRisk } from '@/components/charts/RiskHeatMap';
import { cn, formatINR, timeAgo } from '@/lib/utils';

/* ---------- typed views over Projection.data ---------- */
interface PerProjectTimeline {
  project: string;
  expected_completion: string;
  months_remaining: number;
}
interface TimelineData {
  confidence_level?: number;
  insights?: string[];
  per_project?: PerProjectTimeline[];
}
interface BudgetData {
  confidence_level?: number;
  insights?: string[];
  committed_total_inr?: number;
  projected_spend_inr?: number;
  variance_percent?: number;
}
interface RoiData {
  confidence_level?: number;
  insights?: string[];
  blended_roi_percent?: number;
  best?: { project: string; roi: number };
  worst?: { project: string; roi: number };
  scenarios?: { bear: number; base: number; bull: number };
}
interface RiskData {
  confidence_level?: number;
  insights?: string[];
  top_risks?: HeatRisk[];
}

const TYPE_ORDER: Record<string, number> = { Timeline: 0, Budget: 1, ROI: 2, Risk: 3 };
const TYPE_ICONS: Record<string, React.ReactNode> = {
  Timeline: <CalendarDays size={17} aria-hidden />,
  Budget: <Wallet size={17} aria-hidden />,
  ROI: <TrendingUp size={17} aria-hidden />,
  Risk: <ShieldAlert size={17} aria-hidden />,
};

function shortName(name: string): string {
  return name.replace(/^Olive\s+/, '');
}

interface Props {
  projections: Projection[];
  /** Display-only (project tab) — hides send/export actions. */
  readOnly?: boolean;
  onSend?: (projection: Projection) => void;
  /** Shimmer overlay while regenerating. */
  refreshing?: boolean;
}

export default function ProjectionsGrid({ projections, readOnly, onSend, refreshing }: Props) {
  const { toast } = useToast();
  const sorted = [...projections].sort(
    (a, b) => (TYPE_ORDER[a.projection_type] ?? 9) - (TYPE_ORDER[b.projection_type] ?? 9),
  );

  const downloadJson = (p: Projection) => {
    const blob = new Blob([JSON.stringify(p.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.projection_type.toLowerCase()}-projection.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('⬇️ Projection JSON downloaded');
  };

  const exportPdf = () => {
    toast('🖨 Use your browser dialog to save as PDF', 'info');
    setTimeout(() => window.print(), 350);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {sorted.map((p) => {
        const confidence = Math.round(((p.data.confidence_level as number | undefined) ?? 0) * 100);
        return (
          <article
            key={p.id}
            className={cn('card p-5 flex flex-col gap-4 anim-fade-slide-up', refreshing && 'opacity-60 animate-pulseSoft pointer-events-none')}
            aria-label={`${p.projection_type} projection`}
          >
            <header className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                {TYPE_ICONS[p.projection_type] ?? <Sparkles size={17} aria-hidden />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-bold text-sm leading-snug">{p.projection_title}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Generated {timeAgo(p.generated_at)}</p>
              </div>
            </header>

            {/* Confidence */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400 font-semibold uppercase tracking-wide">Confidence</span>
                <span className="font-bold text-secondary tabular-nums">{confidence}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-secondary anim-progress" style={{ width: `${confidence}%` }} />
              </div>
            </div>

            {/* Body per type */}
            {p.projection_type === 'Timeline' && <TimelineBody data={p.data as TimelineData} />}
            {p.projection_type === 'Budget' && <BudgetBody data={p.data as BudgetData} />}
            {p.projection_type === 'ROI' && <RoiBody data={p.data as RoiData} />}
            {p.projection_type === 'Risk' && <RiskBody data={p.data as RiskData} />}

            {/* Insights */}
            {Array.isArray(p.data.insights) && p.data.insights.length > 0 && (
              <ul className="space-y-1.5 border-t border-gray-100 pt-3">
                {p.data.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                    <Sparkles size={12} className="text-accent shrink-0 mt-0.5" aria-hidden />
                    {ins}
                  </li>
                ))}
              </ul>
            )}

            {!readOnly && (
              <footer className="flex items-center gap-2 border-t border-gray-100 pt-3 mt-auto flex-wrap">
                <Button variant="secondary" className="!py-2 !px-3 text-xs" onClick={() => onSend?.(p)}>
                  <Send size={13} /> Send
                </Button>
                <Button variant="ghost" className="!py-2 !px-3 text-xs border border-gray-200" onClick={exportPdf}>
                  <Printer size={13} /> Export PDF
                </Button>
                <Button
                  variant="ghost"
                  className="!py-2 !px-3 text-xs border border-gray-200"
                  onClick={() => downloadJson(p)}
                >
                  <Download size={13} /> JSON
                </Button>
              </footer>
            )}
          </article>
        );
      })}
    </div>
  );
}

/* ---------- per-type bodies ---------- */

function TimelineBody({ data }: { data: TimelineData }) {
  const rows = (data.per_project ?? []).map((r) => ({
    name: shortName(r.project),
    months: r.months_remaining,
    completion: r.expected_completion,
  }));
  return (
    <div className="space-y-3">
      <div style={{ height: 170 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} unit="mo" />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v} months remaining`, 'Remaining']} />
            <Bar dataKey="months" fill="#14B8A6" radius={[0, 6, 6, 0]} barSize={16} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.name} className="flex justify-between text-xs text-gray-600">
            <span className="truncate pr-3">{r.name}</span>
            <span className="font-semibold whitespace-nowrap">
              {new Date(r.completion).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BudgetBody({ data }: { data: BudgetData }) {
  const committed = data.committed_total_inr ?? 0;
  const projected = data.projected_spend_inr ?? 0;
  const variance = data.variance_percent ?? 0;
  const over = variance > 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'badge',
            over ? 'bg-warning/10 text-warning border-warning/30' : 'bg-success/10 text-success border-success/30',
          )}
        >
          {over ? <TrendingUp size={11} aria-hidden /> : <TrendingDown size={11} aria-hidden />}
          {over ? '+' : ''}
          {variance}% variance
        </span>
      </div>
      <div style={{ height: 170 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[{ name: 'Portfolio', Committed: committed, Projected: projected }]}
            margin={{ left: 8, right: 8, top: 4, bottom: 4 }}
            barGap={12}
          >
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => formatINR(Number(v))} tick={{ fontSize: 10 }} width={70} />
            <Tooltip formatter={(v) => formatINR(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Committed" fill="#0F172A" radius={[6, 6, 0, 0]} barSize={44} animationDuration={800} />
            <Bar dataKey="Projected" fill="#14B8A6" radius={[6, 6, 0, 0]} barSize={44} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RoiBody({ data }: { data: RoiData }) {
  const scenarios = data.scenarios ?? { bear: 0, base: 0, bull: 0 };
  const rows = [
    { name: 'Bear', value: scenarios.bear, fill: '#EF4444' },
    { name: 'Base', value: scenarios.base, fill: '#0F172A' },
    { name: 'Bull', value: scenarios.bull, fill: '#10B981' },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Blended ROI</p>
          <p className="text-3xl font-heading font-bold text-primary tabular-nums">
            {data.blended_roi_percent ?? '—'}
            <span className="text-base text-gray-400">%</span>
          </p>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          {data.best && (
            <span className="badge bg-success/10 text-success border-success/30">
              ▲ Best: {shortName(data.best.project)} · {data.best.roi}%
            </span>
          )}
          {data.worst && (
            <span className="badge bg-warning/10 text-warning border-warning/30">
              ▼ Worst: {shortName(data.worst.project)} · {data.worst.roi}%
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis unit="%" tick={{ fontSize: 10 }} width={40} />
            <Tooltip formatter={(v) => [`${v}%`, 'ROI']} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={42} animationDuration={800}>
              {rows.map((r) => (
                <Cell key={r.name} fill={r.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskBody({ data }: { data: RiskData }) {
  const risks = data.top_risks ?? [];
  return (
    <div className="space-y-4">
      <RiskHeatMap risks={risks} />
      <ul className="space-y-2">
        {risks.map((r, i) => (
          <li key={i} className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
            <p className="text-xs font-semibold text-primary leading-snug">
              <span className="text-gray-400 mr-1">{i + 1}.</span>
              {r.risk}
            </p>
            {r.mitigation && <p className="text-[11px] text-gray-500 mt-1">🛡 {r.mitigation}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
