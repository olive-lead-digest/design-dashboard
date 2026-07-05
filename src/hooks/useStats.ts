'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DashboardStats {
  active_projects: number;
  feasibility_in_progress: number;
  pending_tasks: number;
  overdue_tasks: number;
  completed_this_month: number;
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api<DashboardStats>('/api/stats'),
  });
}
