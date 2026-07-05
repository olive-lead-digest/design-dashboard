'use client';

import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface Props {
  icon: LucideIcon;
  label: string;
  value: number;
  /** Small trend / context line under the number. */
  sub?: React.ReactNode;
  /** Tailwind classes for the icon bubble, e.g. 'bg-secondary/10 text-secondary'. */
  iconClass?: string;
  /** Optional value formatter (receives the rounded animated value). */
  format?: (n: number) => string;
}

export default function KPICard({ icon: Icon, label, value, sub, iconClass, format }: Props) {
  const animated = useCountUp(value);
  const rounded = Math.round(animated);
  const display = format ? format(rounded) : rounded.toLocaleString('en-IN');

  return (
    <div className="card p-5 flex items-start gap-4">
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
          iconClass ?? 'bg-secondary/10 text-secondary',
        )}
      >
        <Icon size={20} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-3xl font-heading font-bold text-primary leading-tight tabular-nums">{display}</p>
        {sub && <div className="mt-1 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">{sub}</div>}
      </div>
    </div>
  );
}
