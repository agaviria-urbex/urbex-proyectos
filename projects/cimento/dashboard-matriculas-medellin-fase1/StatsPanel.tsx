'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LayerCounts } from './types';
import { BarChart3, Loader2 } from 'lucide-react';

const DestinacionBarChart = dynamic(
  () => import('./DestinacionBarChart').then((mod) => ({ default: mod.DestinacionBarChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#a738cd]" />
      </div>
    ),
  }
);

interface StatsPanelProps {
  counts: LayerCounts;
  destinaciones: Record<string, number>;
}

const STAT_BOXES: { key: keyof LayerCounts; label: string }[] = [
  { key: 'matriculas', label: 'Matrículas' },
  { key: 'lotes', label: 'Lotes' },
  { key: 'construcciones', label: 'Construcciones' },
  { key: 'nomenclatura', label: 'Nomenclatura' },
];

export function StatsPanel({ counts, destinaciones }: StatsPanelProps) {
  return (
    <div className="flex h-full flex-col bg-white border-l">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#a738cd]" />
          Estadísticas
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {STAT_BOXES.map(({ key, label }) => (
            <Card key={key}>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold text-[#a738cd]">
                  {counts[key].toLocaleString('es-CO')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por destinación</CardTitle>
          </CardHeader>
          <CardContent>
            <DestinacionBarChart data={destinaciones} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
