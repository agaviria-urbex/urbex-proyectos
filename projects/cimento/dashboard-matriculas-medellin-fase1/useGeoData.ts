'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { withBasePath } from '@/lib/paths';
import { GEOJSON_BASE, MAP_LAYER_CONFIGS } from './layers';
import {
  DEFAULT_FILTERS,
  type DashboardFilters,
  type FilteredLayerData,
  type LayerCounts,
  type LayerData,
  type LayerId,
} from './types';

function getCbml(props: Record<string, unknown>, field?: string): string | null {
  if (!field) return null;
  const value = props[field];
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function matchesMatriculaFilters(
  props: Record<string, unknown>,
  filters: DashboardFilters
): boolean {
  const fuente = String(props.fuente ?? '');
  if (fuente && fuente !== 'matricula') return false;

  if (filters.destinaciones.length > 0) {
    const dest = String(props.destinacion_principal ?? '');
    if (!filters.destinaciones.includes(dest)) return false;
  }

  if (filters.matriculaSearch) {
    const mat = String(props.matricula_inmobiliaria ?? '');
    if (!mat.toLowerCase().includes(filters.matriculaSearch.toLowerCase())) return false;
  }

  return true;
}

function hasActiveFilters(filters: DashboardFilters): boolean {
  return filters.destinaciones.length > 0 || filters.matriculaSearch !== '';
}

function filterCollection(
  collection: FeatureCollection,
  validCbmls: Set<string> | null,
  cbmlField?: string
): FeatureCollection {
  if (!validCbmls || !cbmlField) return collection;

  return {
    type: 'FeatureCollection',
    features: collection.features.filter((feature) => {
      const cbml = getCbml(feature.properties ?? {}, cbmlField);
      return cbml ? validCbmls.has(cbml) : true;
    }),
  };
}

export function useGeoData() {
  const [rawLayers, setRawLayers] = useState<LayerData | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerId, boolean>>(() =>
    Object.fromEntries(
      MAP_LAYER_CONFIGS.map((l) => [l.id, l.defaultVisible])
    ) as Record<LayerId, boolean>
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLayers() {
      try {
        setLoading(true);
        const entries = await Promise.all(
          MAP_LAYER_CONFIGS.map(async (layer) => {
            const url = withBasePath(`${GEOJSON_BASE}/${layer.fileName}`);
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`No se pudo cargar ${layer.fileName}`);
            }
            const data = (await response.json()) as FeatureCollection;
            return [layer.id, data] as const;
          })
        );
        setRawLayers(Object.fromEntries(entries) as LayerData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    }

    loadLayers();
  }, []);

  const filterOptions = useMemo(() => {
    if (!rawLayers) {
      return { destinaciones: [] as string[] };
    }

    const matriculas = rawLayers.base_predios_completa.features.filter(
      (f) => String(f.properties?.fuente ?? '') === 'matricula'
    );

    const destinaciones = [
      ...new Set(
        matriculas
          .map((f) => String(f.properties?.destinacion_principal ?? ''))
          .filter(Boolean)
      ),
    ].sort();

    return { destinaciones };
  }, [rawLayers]);

  const filteredData: FilteredLayerData | null = useMemo(() => {
    if (!rawLayers) return null;

    const matriculas = rawLayers.base_predios_completa;
    const active = hasActiveFilters(filters);

    const validCbmls = active
      ? new Set(
          matriculas.features
            .filter((f) => matchesMatriculaFilters(f.properties ?? {}, filters))
            .map((f) => String(f.properties?.cbml ?? ''))
            .filter(Boolean)
        )
      : null;

    const filteredMatriculaFeatures = active
      ? matriculas.features.filter((f) =>
          matchesMatriculaFilters(f.properties ?? {}, filters)
        )
      : matriculas.features;

    const layers = Object.fromEntries(
      MAP_LAYER_CONFIGS.map((config) => {
        if (config.id === 'base_predios_completa') {
          return [
            config.id,
            {
              type: 'FeatureCollection',
              features: filteredMatriculaFeatures,
            } satisfies FeatureCollection,
          ];
        }

        if (config.id === 'poligono') {
          return [config.id, rawLayers.poligono];
        }

        return [
          config.id,
          filterCollection(rawLayers[config.id], validCbmls, config.cbmlField),
        ];
      })
    ) as LayerData;

    return {
      layers,
      validCbmls,
      filteredMatriculaCount: filteredMatriculaFeatures.filter(
        (f) => String(f.properties?.fuente ?? '') === 'matricula'
      ).length,
      totalMatriculaCount: matriculas.features.filter(
        (f) => String(f.properties?.fuente ?? '') === 'matricula'
      ).length,
    };
  }, [rawLayers, filters]);

  const layerCounts: LayerCounts = useMemo(() => {
    if (!filteredData) {
      return { matriculas: 0, lotes: 0, construcciones: 0, nomenclatura: 0 };
    }

    return {
      matriculas: filteredData.filteredMatriculaCount,
      lotes: filteredData.layers.lotes_filtro.features.length,
      construcciones: filteredData.layers.construcciones_filtro.features.length,
      nomenclatura: filteredData.layers.nomenclatura_filtro.features.length,
    };
  }, [filteredData]);

  const destinaciones = useMemo(() => {
    if (!filteredData) return {} as Record<string, number>;

    const matriculas = filteredData.layers.base_predios_completa.features.filter(
      (f) => String(f.properties?.fuente ?? '') === 'matricula'
    );

    const result: Record<string, number> = {};
    matriculas.forEach((f) => {
      const dest = String(f.properties?.destinacion_principal ?? 'Sin dato');
      result[dest] = (result[dest] ?? 0) + 1;
    });
    return result;
  }, [filteredData]);

  const toggleLayer = useCallback((id: LayerId) => {
    setVisibleLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    visibleLayers,
    toggleLayer,
    filteredData,
    layerCounts,
    destinaciones,
    filterOptions,
  };
}
