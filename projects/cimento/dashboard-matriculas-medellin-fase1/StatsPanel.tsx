'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyCOP } from '@/lib/utils';
import type { LayerStats } from './types';
import { BarChart3 } from 'lucide-react';

interface StatsPanelProps {
  layerStats: LayerStats[];
  summaryStats: {
    matriculas: number;
    avaluoPromedio: number;
    areaPromedio: number;
    destinaciones: Record<string, number>;
  };
  totalMatriculaCount: number;
  filteredMatriculaCount: number;
}

export function StatsPanel({
  layerStats,
  summaryStats,
  totalMatriculaCount,
  filteredMatriculaCount,
}: StatsPanelProps) {
  return (
    <div className="flex h-full flex-col bg-white border-l">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#a738cd]" />
          Estadísticas
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Matrículas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#a738cd]">
              {filteredMatriculaCount}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                / {totalMatriculaCount}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Registros visibles con filtros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Promedios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avalúo promedio</span>
              <span className="font-medium">
                {formatCurrencyCOP(summaryStats.avaluoPromedio, 'N/A')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Área terreno prom.</span>
              <span className="font-medium">
                {summaryStats.areaPromedio > 0
                  ? `${Math.round(summaryStats.areaPromedio).toLocaleString('es-CO')} m²`
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por destinación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(summaryStats.destinaciones).map(([dest, count]) => (
              <Badge key={dest} variant="secondary" className="text-xs">
                {dest}: {count}
              </Badge>
            ))}
            {Object.keys(summaryStats.destinaciones).length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Registros por capa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {layerStats.map((stat) => (
              <div key={stat.id} className="flex items-center justify-between text-sm">
                <span className={stat.isLayerVisible ? '' : 'text-muted-foreground line-through'}>
                  {stat.label}
                </span>
                <span className="font-medium">
                  {stat.visible}
                  <span className="text-muted-foreground font-normal"> / {stat.total}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
