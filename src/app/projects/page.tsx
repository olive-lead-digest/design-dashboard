'use client';

import Shell from '@/components/layout/Shell';
import ProjectsExplorer from '@/components/projects/ProjectsExplorer';

export default function ProjectsPage() {
  return (
    <Shell>
      <ProjectsExplorer title="All Projects" showSort showNewButton />
    </Shell>
  );
}
