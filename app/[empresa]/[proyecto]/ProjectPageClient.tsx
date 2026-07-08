'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const projectModules: Record<string, Record<string, React.ComponentType>> = {
  cimento: {
    'dashboard-matriculas-medellin-fase1': dynamic(
      () => import('@/projects/cimento/dashboard-matriculas-medellin-fase1'),
      {
        ssr: false,
        loading: () => (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#a738cd]" />
          </div>
        ),
      }
    ),
  },
};

interface ProjectPageClientProps {
  empresa: string;
  proyecto: string;
}

export default function ProjectPageClient({ empresa, proyecto }: ProjectPageClientProps) {
  const Module = projectModules[empresa]?.[proyecto];

  if (!Module) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Módulo no encontrado</p>
      </div>
    );
  }

  return <Module />;
}
