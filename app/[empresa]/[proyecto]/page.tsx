import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/projects/registry';
import ProjectPageClient from './ProjectPageClient';

interface ProjectPageProps {
  params: { empresa: string; proyecto: string };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const project = getProjectBySlug(params.empresa, params.proyecto);
  if (!project) notFound();

  return <ProjectPageClient empresa={params.empresa} proyecto={params.proyecto} />;
}
