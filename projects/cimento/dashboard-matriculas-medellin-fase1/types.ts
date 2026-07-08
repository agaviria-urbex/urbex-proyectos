import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type LayerId =
  | 'base_predios_completa'
  | 'nomenclatura_filtro'
  | 'construcciones_filtro'
  | 'lotes_filtro'
  | 'poligono';

export interface LayerConfig {
  id: LayerId;
  label: string;
  fileName: string;
  geometryType: 'polygon' | 'point' | 'mixed';
  defaultVisible: boolean;
  color: string;
  fillOpacity?: number;
  cbmlField?: string;
}

export interface DashboardFilters {
  destinaciones: string[];
  matriculaSearch: string;
}

export type LayerData = Record<LayerId, FeatureCollection>;

export interface FilteredLayerData {
  layers: LayerData;
  validCbmls: Set<string> | null;
  filteredMatriculaCount: number;
  totalMatriculaCount: number;
}

export interface LayerCounts {
  matriculas: number;
  lotes: number;
  construcciones: number;
  nomenclatura: number;
}

export type GeoFeature = Feature<Geometry, Record<string, unknown>>;

export const DEFAULT_FILTERS: DashboardFilters = {
  destinaciones: [],
  matriculaSearch: '',
};
