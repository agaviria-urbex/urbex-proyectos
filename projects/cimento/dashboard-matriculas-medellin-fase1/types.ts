import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type LayerId =
  | 'poligono'
  | 'barrio_filtro'
  | 'estrato_filtro'
  | 'lotes_filtro'
  | 'construcciones_filtro'
  | 'nomenclatura_filtro'
  | 'usos_predio_filtro'
  | 'base_predios_completa';

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
  estratoMin: number;
  estratoMax: number;
  barrio: string;
  areaMin: number;
  areaMax: number;
  avaluoMin: number;
  avaluoMax: number;
  matriculaSearch: string;
  cbmlSearch: string;
}

export type LayerData = Record<LayerId, FeatureCollection>;

export interface FilteredLayerData {
  layers: LayerData;
  validCbmls: Set<string> | null;
  filteredMatriculaCount: number;
  totalMatriculaCount: number;
}

export interface LayerStats {
  id: LayerId;
  label: string;
  total: number;
  visible: number;
  isLayerVisible: boolean;
}

export type GeoFeature = Feature<Geometry, Record<string, unknown>>;

export const DEFAULT_FILTERS: DashboardFilters = {
  destinaciones: [],
  estratoMin: 1,
  estratoMax: 6,
  barrio: 'all',
  areaMin: 0,
  areaMax: 100000,
  avaluoMin: 0,
  avaluoMax: 10000000000,
  matriculaSearch: '',
  cbmlSearch: '',
};
