'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Projection } from '@/types';

export function useProjections() {
  return useQuery({
    queryKey: ['projections'],
    queryFn: () => api<Projection[]>('/api/projections'),
  });
}
