'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TeamTask } from '@/types';

export interface AllTasksResponse {
  tasks: TeamTask[];
  projects: { id: string; name: string }[];
}

export function useAllTasks() {
  return useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => api<AllTasksResponse>('/api/tasks'),
  });
}
