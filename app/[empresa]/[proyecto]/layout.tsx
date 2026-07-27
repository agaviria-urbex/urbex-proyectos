'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkProjectAccess } from '@/lib/project-access';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    const empresa = params.empresa as string;
    const proyecto = params.proyecto as string;

    if (user.group?.includes('@urbex')) {
      setHasAccess(true);
      setCheckingAccess(false);
      return;
    }

    const verify = async () => {
      setCheckingAccess(true);
      try {
        const allowed = await checkProjectAccess(user.email, empresa, proyecto);
        if (allowed) {
          setHasAccess(true);
        } else {
          setAccessError('No tienes permisos para acceder a este proyecto.');
        }
      } catch {
        setAccessError('Error al verificar permisos de acceso.');
      } finally {
        setCheckingAccess(false);
      }
    };

    verify();
  }, [user, isLoading, router, params]);

  if (isLoading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#a738cd]" />
      </div>
    );
  }

  if (!user) return null;

  if (accessError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">{accessError}</p>
          <Button
            onClick={() => router.push('/proyectos')}
            className="bg-[#a738cd] hover:bg-[#8c2ca3]"
          >
            Volver a mis proyectos
          </Button>
        </div>
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  return null;
}
