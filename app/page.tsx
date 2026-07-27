'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { ConfirmEmailForm } from '@/components/ConfirmEmailForm';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { Loader2 } from 'lucide-react';

type AuthView = 'login' | 'register' | 'confirm' | 'forgot';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [confirmEmail, setConfirmEmail] = useState('');

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/proyectos');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Panel izquierdo - marca */}
      <div className="hidden w-1/2 flex-col justify-between bg-urbex-black p-12 text-white lg:flex">
        <div>
          <div className="text-2xl font-bold tracking-tight">
            URBEX<span className="text-primary">.</span>
          </div>
          <p className="mt-1 text-sm text-gray-400">Proyectos</p>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Plataforma de proyectos Taylor Made para empresas
          </h1>
          <p className="text-gray-300">
            Accede a los aplicativos personalizados que Urbex desarrolla a la
            medida de tu empresa y gestiona tus proyectos en un solo lugar.
          </p>
        </div>
        <p className="text-xs text-gray-500">© Urbex</p>
      </div>

      {/* Panel derecho - auth */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Marca visible en móvil */}
          <div className="mb-8 text-center lg:hidden">
            <div className="text-2xl font-bold tracking-tight">
              URBEX<span className="text-primary">.</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Proyectos</p>
          </div>

          {authView === 'login' && (
            <LoginForm
              onToggleForm={() => setAuthView('register')}
              onForgotPassword={() => setAuthView('forgot')}
            />
          )}
          {authView === 'register' && (
            <RegisterForm
              onToggleForm={() => setAuthView('login')}
              onRegistrationSuccess={(email) => {
                setConfirmEmail(email);
                setAuthView('confirm');
              }}
            />
          )}
          {authView === 'confirm' && (
            <ConfirmEmailForm
              email={confirmEmail}
              onBackToLogin={() => setAuthView('login')}
            />
          )}
          {authView === 'forgot' && (
            <ForgotPasswordForm onBackToLogin={() => setAuthView('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
