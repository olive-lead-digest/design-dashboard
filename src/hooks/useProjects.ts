'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Project } from '@/types';

export interface ProjectFilters {
  status?: string;
  search?: string;
  sortBy?: string;
}

export function useProjects(filters: ProjectFilters = {}) {
  const { status, search, sortBy } = filters;
  return useQuery({
    queryKey: ['projects', status ?? 'All', search ?? '', sortBy ?? ''],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status && status !== 'All') params.set('status', status);
      if (search) params.set('search', search);
      if (sortBy) params.set('sort_by', sortBy);
      const qs = params.toString();
      return api<Project[]>(`/api/projects${qs ? `?${qs}` : ''}`);
    },
  });
}
