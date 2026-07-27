export interface ApiFilters {
  segmentacion: 'Localidad' | 'Barrio catastral';
  dia_semana?: string;
  franja_horaria?: string;
  edad_min?: number;
  edad_max?: number;
  vehiculo_min?: number;
  vehiculo_max?: number;
  prop_min?: number;
  prop_max?: number;
  tiene_propiedades?: boolean;
  barrios?: string[];
}

export interface ChartData {
  labels: Array<string | number>;
  values: number[];
}

export interface KPILabel {
  label: string;
  value: number;
}

export interface LocalidadData {
  locnombre: string;
  conteo: number;
}

export interface GeoFeature {
  type: string;
  properties: {
    nombre: string;
    conteo: number;
    color: string;
  };
  geometry: GeoJSON.Geometry;
}

export interface GeoData {
  type: string;
  features: GeoFeature[];
}

export interface ApiResponse {
  labels: KPILabel[];
  centroide?: {
    marker: string;
    latitud: number;
    longitud: number;
  };
  datageometry: GeoData;
  datalocalidad: LocalidadData[];
  marcas: ChartData;
  avaluoVehiculo: ChartData;
  numeroVehiculos: ChartData;
  avaluoPropiedades: ChartData;
  estrato: ChartData;
  numeroPropiedades: ChartData;
  edades: ChartData;
  tipoVehiculos: ChartData;
  diasVisitas: ChartData;
  horasVisitas: ChartData;
  urlfile?: string;
}

export interface IsochroneFilters {
  isocrona: '5' | '10' | '15';
}

export interface IsochroneData {
  estrato: ChartData;
  clasificacion: ChartData;
  valorcomercial: number;
  geometry: string;
  placas: number;
  marcas: ChartData;
  modelo: ChartData;
  centroide?: {
    marker: string;
    latitud: number;
    longitud: number;
  };
}
