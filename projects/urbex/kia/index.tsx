'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BackToProjectsButton } from '@/components/BackToProjectsButton';
import { LogOut, Map, Users, Car } from 'lucide-react';
import { Leads } from './components/Leads';
import { Propietarios } from './components/Propietarios';
import { Heatmap } from './components/Heatmap';
import { cn } from '@/lib/utils';

const URBEX_LOGO =
  'https://iconsapp.nyc3.digitaloceanspaces.com/urbex_negativo.png';

type ModuleId = 'leads' | 'propietarios' | 'heatmap';

const NAV_ITEMS: Array<{
  id: ModuleId;
  label: string;
  icon: typeof Users;
}> = [
  { id: 'leads', label: 'Leads', icon: Car },
  { id: 'propietarios', label: 'Propietarios', icon: Users },
  { id: 'heatmap', label: 'Mapa de calor', icon: Map },
];

export default function DashboardKia() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleId>('leads');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={URBEX_LOGO} alt="Urbex" className="h-8" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Dashboard KIA
            </h1>
            <p className="text-xs text-muted-foreground">
              Urbex · Perfilamiento de clientes y cambio de propietario
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

      <div className="flex flex-1 min-h-0">
        <aside className="hidden w-56 shrink-0 border-r bg-white p-3 md:block">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Módulos
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveModule(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-purple-50 text-[#a738cd]'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-4 flex flex-wrap gap-2 md:hidden">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.id}
                variant={activeModule === item.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveModule(item.id)}
                className={
                  activeModule === item.id
                    ? 'bg-[#a738cd] hover:bg-[#8c2ca3]'
                    : ''
                }
              >
                {item.label}
              </Button>
            ))}
          </div>

          {user?.email ? (
            activeModule === 'leads' ? (
              <Leads userEmail={user.email} />
            ) : activeModule === 'propietarios' ? (
              <Propietarios userEmail={user.email} />
            ) : (
              <Heatmap userEmail={user.email} />
            )
          ) : (
            <p className="text-sm text-gray-500">Cargando sesión...</p>
          )}
        </main>
      </div>
    </div>
  );
}
