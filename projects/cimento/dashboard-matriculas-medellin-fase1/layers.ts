import type { LayerConfig } from './types';

export const GEOJSON_BASE = '/data/cimento/dashboard-matriculas-medellin-fase1/geojson';

export const MAP_LAYER_CONFIGS: LayerConfig[] = [
  {
    id: 'base_predios_completa',
    label: 'Matrículas',
    fileName: 'base_predios_completa.geojson',
    geometryType: 'point',
    defaultVisible: true,
    color: '#a738cd',
    cbmlField: 'cbml',
  },
  {
    id: 'nomenclatura_filtro',
    label: 'Nomenclatura',
    fileName: 'nomenclatura_filtro.geojson',
    geometryType: 'polygon',
    defaultVisible: true,
    color: '#06b6d4',
    fillOpacity: 0.2,
    cbmlField: 'cbml_left',
  },
  {
    id: 'construcciones_filtro',
    label: 'Construcciones',
    fileName: 'construcciones_filtro.geojson',
    geometryType: 'polygon',
    defaultVisible: true,
    color: '#f97316',
    fillOpacity: 0.35,
    cbmlField: 'cbml',
  },
  {
    id: 'lotes_filtro',
    label: 'Lotes',
    fileName: 'lotes_filtro.geojson',
    geometryType: 'polygon',
    defaultVisible: true,
    color: '#828DEE',
    fillOpacity: 0.25,
    cbmlField: 'cbml',
  },
  {
    id: 'poligono',
    label: 'Polígono Cimento',
    fileName: 'poligono.geojson',
    geometryType: 'polygon',
    defaultVisible: true,
    color: '#a738cd',
    fillOpacity: 0.05,
  },
];
