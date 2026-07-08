'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MAP_LAYER_CONFIGS } from './layers';
import type { DashboardFilters, LayerId } from './types';
import { Layers, Filter, RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  resetFilters: () => void;
  visibleLayers: Record<LayerId, boolean>;
  toggleLayer: (id: LayerId) => void;
  filterOptions: {
    destinaciones: string[];
  };
}

export function FilterPanel({
  filters,
  setFilters,
  resetFilters,
  visibleLayers,
  toggleLayer,
  filterOptions,
}: FilterPanelProps) {
  const toggleDestinacion = (dest: string) => {
    setFilters((prev) => ({
      ...prev,
      destinaciones: prev.destinaciones.includes(dest)
        ? prev.destinaciones.filter((d) => d !== dest)
        : [...prev.destinaciones, dest],
    }));
  };

  return (
    <div className="flex h-full flex-col bg-white border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#a738cd]" />
          Filtros
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <section>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#a738cd]" />
              Capas del mapa
            </h3>
            <div className="space-y-2">
              {MAP_LAYER_CONFIGS.map((layer) => (
                <div key={layer.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`layer-${layer.id}`}
                    checked={visibleLayers[layer.id]}
                    onCheckedChange={() => toggleLayer(layer.id)}
                  />
                  <label
                    htmlFor={`layer-${layer.id}`}
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: layer.color }}
                    />
                    {layer.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section>
            <Label className="text-sm font-medium mb-2 block">Destinación</Label>
            <div className="space-y-2">
              {filterOptions.destinaciones.map((dest) => (
                <div key={dest} className="flex items-center gap-2">
                  <Checkbox
                    id={`dest-${dest}`}
                    checked={filters.destinaciones.includes(dest)}
                    onCheckedChange={() => toggleDestinacion(dest)}
                  />
                  <label htmlFor={`dest-${dest}`} className="text-sm cursor-pointer">
                    {dest}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <Label>Matrícula</Label>
            <Input
              placeholder="Buscar matrícula..."
              value={filters.matriculaSearch}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, matriculaSearch: e.target.value }))
              }
            />
          </section>

          <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
