'use client';

import { cn } from '@/lib/utils';

export interface HeatRisk {
  risk: string;
  likelihood: string;
  impact: string;
  mitigation?: string;
}

const LEVELS = ['Low', 'Medium', 'High'] as const;
type Level = (typeof LEVELS)[number];

function norm(v: string): Level {
  const s = v.toLowerCase();
  if (s.startsWith('h')) return 'High';
  if (s.startsWith('m')) return 'Medium';
  return 'Low';
}

/** Cell background by severity score (likelihood idx + impact idx: 0–4). */
const CELL_BG = [
  'bg-success/10',
  'bg-success/15',
  'bg-accent/15',
  'bg-warning/15',
  'bg-warning/25',
];

/** 3×3 likelihood × impact heat map with positioned risk dots + hover tooltips. */
export default function RiskHeatMap({ risks }: { risks: HeatRisk[] }) {
  return (
    <div className="w-full">
      <div className="grid" style={{ gridTemplateColumns: 'auto repeat(3, 1fr)' }}>
        {/* Header row */}
        <div />
        {LEVELS.map((l) => (
          <div key={`col-${l}`} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wide pb-1.5">
            {l}
          </div>
        ))}

        {/* Rows: impact High → Low (top to bottom) */}
        {[...LEVELS].reverse().map((impact) => (
          <RowFor key={impact} impact={impact} risks={risks} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 px-8">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Likelihood →</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">↑ Impact</p>
      </div>
    </div>
  );
}

function RowFor({ impact, risks }: { impact: Level; risks: HeatRisk[] }) {
  return (
    <>
      <div className="flex items-center pr-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          {impact}
        </span>
      </div>
      {LEVELS.map((likelihood) => {
        const cellRisks = risks
          .map((r, idx) => ({ ...r, idx }))
          .filter((r) => norm(r.impact) === impact && norm(r.likelihood) === likelihood);
        const score = LEVELS.indexOf(likelihood) + LEVELS.indexOf(impact);
        return (
          <div
            key={`${impact}-${likelihood}`}
            className={cn(
              'relative min-h-[68px] border border-white/80 flex flex-wrap items-center justify-center gap-1.5 p-1.5',
              CELL_BG[score] ?? CELL_BG[0],
            )}
          >
            {cellRisks.map((r) => (
              <span key={r.idx} className="relative group">
                <button
                  aria-label={`Risk ${r.idx + 1}: ${r.risk}. Likelihood ${likelihood}, impact ${impact}.`}
                  className={cn(
                    'w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-sm transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary',
                    score >= 3 ? 'bg-warning' : score === 2 ? 'bg-accent' : 'bg-secondary',
                  )}
                >
                  {r.idx + 1}
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute z-30 hidden group-hover:block group-focus-within:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 card p-2.5 text-left"
                >
                  <span className="block text-xs font-semibold text-primary leading-snug">{r.risk}</span>
                  {r.mitigation && <span className="block text-[11px] text-gray-500 mt-1 leading-snug">🛡 {r.mitigation}</span>}
                </span>
              </span>
            ))}
          </div>
        );
      })}
    </>
  );
}
