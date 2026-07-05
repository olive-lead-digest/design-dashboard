import { cn } from '@/lib/utils';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/lib/constants';

export function StatusBadge({ status, pulse }: { status: string; pulse?: boolean }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 border-gray-300', pulse && 'anim-badge-pulse')}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={cn('badge border-transparent', PRIORITY_COLORS[priority] ?? 'bg-gray-100 text-gray-600')}>{priority}</span>;
}
