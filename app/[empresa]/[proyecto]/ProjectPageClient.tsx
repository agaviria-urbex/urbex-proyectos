'use client';

import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function DashboardLoadError() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar el dashboard</AlertTitle>
        <AlertDescription>
          No se pudo cargar el módulo. Detén el servidor de desarrollo, elimina la
          carpeta <code className="text-xs">.next</code> y ejecuta{' '}
          <code className="text-xs">npm run dev</code> de nuevo.
        </AlertDescription>
      </Alert>
    </div>
  );
}

const projectModules: Record<string, Record<string, React.ComponentType>> = {
  cimento: {
    'dashboard-matriculas-medellin-fase1': dynamic(
      () =>
        import('@/projects/cimento/dashboard-matriculas-medellin-fase1').catch((err) => {
          console.error('Error cargando dashboard:', err);
          return { default: DashboardLoadError };
        }),
      {
        ssr: false,
        loading: () => (
          <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#a738cd] mx-auto mb-3" />
              <p className="text-gray-600">Cargando dashboard...</p>
            </div>
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
