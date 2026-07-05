'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AccountabilityMetric } from '@/types';

export function useAccountability(projectId?: string) {
  return useQuery({
    queryKey: ['accountability', projectId ?? 'global'],
    queryFn: () =>
      api<AccountabilityMetric[]>(
        projectId ? `/api/projects/${projectId}/tasks/accountability` : '/api/tasks/accountability',
      ),
  });
}
