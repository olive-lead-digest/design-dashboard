'use client';

import type { FeasibilityTimeline } from '@/types';

const PHASE_COLORS = ['#14B8A6', '#0EA5E9', '#F59E0B', '#8B5CF6', '#10B981', '#F97316', '#EC4899'];

/** Horizontal feasibility phase bar — segment widths proportional to months. */
export default function TimelineChart({ timeline }: { timeline: FeasibilityTimeline }) {
  const total = timeline.total_months || timeline.phases.reduce((s, p) => s + p.months, 0) || 1;

  return (
    <div className="space-y-3">
      <div className="flex h-11 rounded-xl overflow-hidden border border-gray-200" role="img" aria-label={`Project timeline: ${total} months across ${timeline.phases.length} phases`}>
        {timeline.phases.map((p, i) => (
          <div
            key={p.name}
            className="relative flex items-center justify-center transition-all duration-300 hover:brightness-110 min-w-0"
            style={{ width: `${(p.months / total) * 100}%`, background: PHASE_COLORS[i % PHASE_COLORS.length] }}
            title={`${p.name} — ${p.months} month${p.months === 1 ? '' : 's'}`}
          >
            <span className="hidden sm:block text-[10px] font-bold text-white/95 px-1.5 truncate">
              {p.name}
            </span>
          </div>
        ))}
      </div>

      {/* Month ruler */}
      <div className="flex justify-between text-[10px] text-gray-400 px-0.5 font-mono" aria-hidden>
        <span>M0</span>
        <span>M{Math.round(total / 2)}</span>
        <span>M{total}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {timeline.phases.map((p, i) => (
          <span key={p.name} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }}
              aria-hidden
            />
            {p.name} <span className="text-gray-400">({p.months}mo)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
