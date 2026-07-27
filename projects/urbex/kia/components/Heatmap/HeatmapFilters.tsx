'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KiaHeatFilters, KiaHeatMetric, KiaHeatQuality } from '../../types';

export interface LayerToggles {
  loc: boolean;
  heat: boolean;
  sec: boolean;
  points: boolean;
  bounds: boolean;
}

interface HeatmapFiltersProps {
  filters: KiaHeatFilters;
  brands: string[];
  years: string[];
  hasDims: boolean;
  layers: LayerToggles;
  basemap: string;
  search: string;
  searchOptions: string[];
  filterNote: string;
  onFiltersChange: (next: Partial<KiaHeatFilters>) => void;
  onLayersChange: (next: Partial<LayerToggles>) => void;
  onBasemapChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  onReset: () => void;
  onExportCsv: () => void;
}

export function HeatmapFilters({
  filters,
  brands,
  years,
  hasDims,
  layers,
  basemap,
  search,
  searchOptions,
  filterNote,
  onFiltersChange,
  onLayersChange,
  onBasemapChange,
  onSearchChange,
  onSearchSubmit,
  onReset,
  onExportCsv,
}: HeatmapFiltersProps) {
  const setBrand = (v: string) => {
    const brand = parseInt(v, 10);
    onFiltersChange({
      brand,
      ...(brand >= 0 ? { year: -1, metric: 'cars' as KiaHeatMetric } : {}),
    });
  };
  const setYear = (v: string) => {
    const year = parseInt(v, 10);
    onFiltersChange({
      year,
      ...(year >= 0 ? { brand: -1, metric: 'cars' as KiaHeatMetric } : {}),
    });
  };
  const setMetric = (metric: KiaHeatMetric) => {
    onFiltersChange({
      metric,
      ...(metric === 'val' ? { brand: -1, year: -1 } : {}),
    });
  };

  const layerItems: Array<{ key: keyof LayerToggles; label: string }> = [
    { key: 'loc', label: 'Densidad' },
    { key: 'heat', label: 'Calor' },
    { key: 'sec', label: 'Sectores' },
    { key: 'points', label: 'Puntos' },
    { key: 'bounds', label: 'Límites' },
  ];

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Input
          list="hm-search-dl"
          placeholder="Buscar localidad o sector…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchSubmit();
          }}
          onBlur={onSearchSubmit}
        />
        <datalist id="hm-search-dl">
          {searchOptions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>

        <Select value={basemap} onValueChange={onBasemapChange}>
          <SelectTrigger>
            <SelectValue placeholder="Basemap" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Claro</SelectItem>
            <SelectItem value="voyager">Voyager</SelectItem>
            <SelectItem value="dark">Oscuro</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.quality}
          onValueChange={(v) =>
            onFiltersChange({ quality: v as KiaHeatQuality })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda calidad</SelectItem>
            <SelectItem value="S">Éxito</SelectItem>
            <SelectItem value="A">Ambiguo</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onReset}>
            Reset
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onExportCsv}>
            CSV
          </Button>
        </div>
      </div>

      {hasDims && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Select value={String(filters.brand)} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-1">Todas las marcas</SelectItem>
              {brands.map((b, i) => (
                <SelectItem key={b} value={String(i)}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(filters.year)} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-1">Todos los años</SelectItem>
              {years.map((y, i) => (
                <SelectItem key={y} value={String(i)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filters.metric === 'cars' ? 'default' : 'outline'}
              className={
                filters.metric === 'cars'
                  ? 'flex-1 bg-[#a738cd] hover:bg-[#8c2ca3]'
                  : 'flex-1'
              }
              onClick={() => setMetric('cars')}
            >
              Carros
            </Button>
            <Button
              size="sm"
              variant={filters.metric === 'val' ? 'default' : 'outline'}
              disabled={filters.brand >= 0 || filters.year >= 0}
              className={
                filters.metric === 'val'
                  ? 'flex-1 bg-[#a738cd] hover:bg-[#8c2ca3]'
                  : 'flex-1'
              }
              onClick={() => setMetric('val')}
            >
              Avalúo
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {layerItems.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-1.5 text-gray-700">
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={(e) => onLayersChange({ [key]: e.target.checked })}
              className="accent-[#a738cd]"
            />
            {label}
          </label>
        ))}
      </div>

      {filterNote ? (
        <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
          {filterNote}
        </p>
      ) : null}
    </div>
  );
}
