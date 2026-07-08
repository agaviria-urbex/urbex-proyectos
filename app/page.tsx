'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { ConfirmEmailForm } from '@/components/ConfirmEmailForm';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { Loader2 } from 'lucide-react';
import { projects } from '@/projects/registry';

const URBEX_LOGO =
  'https://iconsapp.nyc3.digitaloceanspaces.com/urbex_negativo.png';

type AuthView = 'login' | 'register' | 'confirm' | 'forgot';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [confirmEmail, setConfirmEmail] = useState('');

  const defaultProject = projects[0];

  useEffect(() => {
    if (!isLoading && user && defaultProject) {
      router.push(defaultProject.url);
    }
  }, [user, isLoading, router, defaultProject]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#a738cd]" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#a738cd]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex flex-col">
      <header className="p-6 flex justify-center">
        <img src={URBEX_LOGO} alt="Urbex" className="h-10" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="text-center mb-8 max-w-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Urbex Proyectos</h1>
          <p className="text-gray-600">
            Plataforma de aplicativos personalizados por empresa. Inicia sesión para acceder a tu proyecto.
          </p>
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
      </main>
    </div>
  );
}
