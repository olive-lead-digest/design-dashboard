'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CostBreakdown } from '@/types';
import { formatINR } from '@/lib/utils';

const COLORS: Record<string, string> = {
  Land: '#0F172A',
  Construction: '#14B8A6',
  Design: '#F59E0B',
  Contingency: '#3B82F6',
};

interface Props {
  breakdown: CostBreakdown;
  height?: number;
}

export default function CostBreakdownChart({ breakdown, height = 260 }: Props) {
  const data = [
    { name: 'Land', value: breakdown.land },
    { name: 'Construction', value: breakdown.construction },
    { name: 'Design', value: breakdown.design },
    { name: 'Contingency', value: breakdown.contingency },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">No cost data yet</p>;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={3}
            strokeWidth={2}
            animationDuration={800}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={COLORS[d.name] ?? '#94A3B8'} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatINR(Number(v))} />
          <Legend
            iconType="circle"
            iconSize={9}
            formatter={(name) => {
              const item = data.find((d) => d.name === name);
              return (
                <span className="text-xs text-gray-600">
                  {String(name)} · {item ? formatINR(item.value) : ''}
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
