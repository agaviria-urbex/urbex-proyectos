'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BackToProjectsButton } from '@/components/BackToProjectsButton';
import { LogOut } from 'lucide-react';
import { SearchFilters } from './components/SearchFilters';

const URBEX_LOGO =
  'https://iconsapp.nyc3.digitaloceanspaces.com/urbex_negativo.png';

export default function LeadsGeneration() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={URBEX_LOGO} alt="Urbex" className="h-8" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Generador de leads
            </h1>
            <p className="text-xs text-muted-foreground">
              Urbex · Propiedades, vehículos y contacto
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BackToProjectsButton />
          <Button variant="outline" size="sm" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 p-6">
        <p className="mb-6 text-sm text-gray-600">
          Información general de propiedades, vehículos y de contacto a partir de
          identificación, placa, email o teléfonos.
        </p>
        {user?.email ? (
          <SearchFilters userEmail={user.email} />
        ) : (
          <p className="text-sm text-gray-500">Cargando sesión...</p>
        )}
      </main>
    </div>
  );
}
