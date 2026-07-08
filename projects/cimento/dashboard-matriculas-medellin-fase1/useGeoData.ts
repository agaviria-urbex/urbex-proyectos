'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { withBasePath } from '@/lib/paths';
import { GEOJSON_BASE, LAYER_CONFIGS } from './layers';
import {
  DEFAULT_FILTERS,
  type DashboardFilters,
  type FilteredLayerData,
  type LayerData,
  type LayerId,
  type LayerStats,
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

  const estrato = Number(props.estrato ?? props.estrato_usos ?? 0);
  if (estrato > 0 && (estrato < filters.estratoMin || estrato > filters.estratoMax)) {
    return false;
  }

  if (filters.barrio !== 'all') {
    const barrio = String(props.barrio ?? '');
    if (barrio !== filters.barrio) return false;
  }

  const area = Number(props.area_terreno ?? 0);
  if (area > 0 && (area < filters.areaMin || area > filters.areaMax)) return false;

  const avaluo = Number(props.avaluototal ?? 0);
  if (avaluo > 0 && (avaluo < filters.avaluoMin || avaluo > filters.avaluoMax)) return false;

  if (filters.matriculaSearch) {
    const mat = String(props.matricula_inmobiliaria ?? '');
    if (!mat.toLowerCase().includes(filters.matriculaSearch.toLowerCase())) return false;
  }

  if (filters.cbmlSearch) {
    const cbml = String(props.cbml ?? '');
    if (!cbml.includes(filters.cbmlSearch)) return false;
  }

  return true;
}

function hasActiveFilters(filters: DashboardFilters): boolean {
  return (
    filters.destinaciones.length > 0 ||
    filters.estratoMin > 1 ||
    filters.estratoMax < 6 ||
    filters.barrio !== 'all' ||
    filters.areaMin > 0 ||
    filters.areaMax < 100000 ||
    filters.avaluoMin > 0 ||
    filters.avaluoMax < 10000000000 ||
    filters.matriculaSearch !== '' ||
    filters.cbmlSearch !== ''
  );
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
      LAYER_CONFIGS.map((l) => [l.id, l.defaultVisible])
    ) as Record<LayerId, boolean>
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLayers() {
      try {
        setLoading(true);
        const entries = await Promise.all(
          LAYER_CONFIGS.map(async (layer) => {
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
      return {
        destinaciones: [] as string[],
        barrios: [] as string[],
        areaRange: [0, 100000] as [number, number],
        avaluoRange: [0, 10000000000] as [number, number],
      };
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

    const barrios = [
      ...new Set(
        matriculas.map((f) => String(f.properties?.barrio ?? '')).filter(Boolean)
      ),
    ].sort();

    const areas = matriculas
      .map((f) => Number(f.properties?.area_terreno ?? 0))
      .filter((v) => v > 0);
    const avaluos = matriculas
      .map((f) => Number(f.properties?.avaluototal ?? 0))
      .filter((v) => v > 0);

    return {
      destinaciones,
      barrios,
      areaRange: [
        areas.length ? Math.floor(Math.min(...areas)) : 0,
        areas.length ? Math.ceil(Math.max(...areas)) : 100000,
      ] as [number, number],
      avaluoRange: [
        avaluos.length ? Math.floor(Math.min(...avaluos)) : 0,
        avaluos.length ? Math.ceil(Math.max(...avaluos)) : 10000000000,
      ] as [number, number],
    };
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
      LAYER_CONFIGS.map((config) => {
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

  const layerStats: LayerStats[] = useMemo(() => {
    if (!rawLayers || !filteredData) return [];

    return LAYER_CONFIGS.map((config) => ({
      id: config.id,
      label: config.label,
      total: rawLayers[config.id].features.length,
      visible: filteredData.layers[config.id].features.length,
      isLayerVisible: visibleLayers[config.id],
    }));
  }, [rawLayers, filteredData, visibleLayers]);

  const summaryStats = useMemo(() => {
    if (!filteredData || !rawLayers) {
      return {
        matriculas: 0,
        avaluoPromedio: 0,
        areaPromedio: 0,
        destinaciones: {} as Record<string, number>,
      };
    }

    const matriculas = filteredData.layers.base_predios_completa.features.filter(
      (f) => String(f.properties?.fuente ?? '') === 'matricula'
    );

    const avaluos = matriculas
      .map((f) => Number(f.properties?.avaluototal ?? 0))
      .filter((v) => v > 0);
    const areas = matriculas
      .map((f) => Number(f.properties?.area_terreno ?? 0))
      .filter((v) => v > 0);

    const destinaciones: Record<string, number> = {};
    matriculas.forEach((f) => {
      const dest = String(f.properties?.destinacion_principal ?? 'Sin dato');
      destinaciones[dest] = (destinaciones[dest] ?? 0) + 1;
    });

    return {
      matriculas: matriculas.length,
      avaluoPromedio: avaluos.length
        ? avaluos.reduce((a, b) => a + b, 0) / avaluos.length
        : 0,
      areaPromedio: areas.length
        ? areas.reduce((a, b) => a + b, 0) / areas.length
        : 0,
      destinaciones,
    };
  }, [filteredData, rawLayers]);

  const toggleLayer = useCallback((id: LayerId) => {
    setVisibleLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      areaMin: filterOptions.areaRange[0],
      areaMax: filterOptions.areaRange[1],
      avaluoMin: filterOptions.avaluoRange[0],
      avaluoMax: filterOptions.avaluoRange[1],
    });
  }, [filterOptions]);

  useEffect(() => {
    if (filterOptions.areaRange[1] > 0) {
      setFilters((prev) => ({
        ...prev,
        areaMin: filterOptions.areaRange[0],
        areaMax: filterOptions.areaRange[1],
        avaluoMin: filterOptions.avaluoRange[0],
        avaluoMax: filterOptions.avaluoRange[1],
      }));
    }
  }, [filterOptions]);

  return {
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
  };
}
