'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { MapPanel } from './MapPanel';
import { StatsPanel } from './StatsPanel';
import { useGeoData } from './useGeoData';

const URBEX_LOGO =
  'https://iconsapp.nyc3.digitaloceanspaces.com/urbex_negativo.png';

export default function DashboardMatriculasMedellin() {
  const { logout } = useAuth();
  const {
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    visibleLayers,
    toggleLayer,
    filteredData,
    layerStats,
    summaryStats,
    filterOptions,
  } = useGeoData();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#a738cd] mx-auto mb-3" />
          <p className="text-gray-600">Cargando datos geográficos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium mb-2">Error al cargar el dashboard</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <img src={URBEX_LOGO} alt="Urbex" className="h-8" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Dashboard Matrículas Medellín - Fase 1
            </h1>
            <p className="text-xs text-muted-foreground">Cimento · Villa Carlota / Barrio Colombia</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-80 shrink-0">
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            visibleLayers={visibleLayers}
            toggleLayer={toggleLayer}
            filterOptions={filterOptions}
          />
        </div>

        <div className="w-1/2 p-3 min-w-0">
          <MapPanel
            layers={filteredData?.layers ?? null}
            visibleLayers={visibleLayers}
          />
        </div>

        <div className="flex-1 min-w-[280px] max-w-sm">
          <StatsPanel
            layerStats={layerStats}
            summaryStats={summaryStats}
            totalMatriculaCount={filteredData?.totalMatriculaCount ?? 0}
            filteredMatriculaCount={filteredData?.filteredMatriculaCount ?? 0}
          />
        </div>
      </div>
    </div>
  );
}
