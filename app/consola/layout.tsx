'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkUrbexGroupAccess } from '@/lib/auth';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConsolaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      if (isLoading) return;

      if (!user) {
        router.push('/');
        return;
      }

      setIsCheckingAccess(true);
      try {
        const hasUrbexAccess = await checkUrbexGroupAccess();
        if (hasUrbexAccess) {
          setHasAccess(true);
        } else {
          setAccessError('No tienes permisos para acceder a la consola de administración.');
        }
      } catch {
        setAccessError('Error al verificar permisos de acceso.');
      } finally {
        setIsCheckingAccess(false);
      }
    };

    verifyAccess();
  }, [user, isLoading, router]);

  if (isLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Verificando permisos de acceso...</p>
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
          <Button onClick={() => router.push('/')} className="bg-[#a738cd] hover:bg-[#8c2ca3]">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  return null;
}
