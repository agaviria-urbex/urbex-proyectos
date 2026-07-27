export interface KiaLead {
  plate: string;
  name?: string;
  modelRaw?: string;
  modelGroup: string;
  manufactureYear: number;
  yearBand: string;
  bodyType?: string;
  serviceType?: string;
  taxYear?: number;
  registrationYear?: number;
  gapYears?: number;
  ownershipPct?: number;
  ownerId?: string | null;
  ownerName: string;
  ownerType: 'Individual' | 'Company' | string;
  emailPrimary?: string | null;
  phonePrimary?: string | null;
  contactStatus: string;
  city?: string | null;
  serviceTag: string;
  outreachPriority?: string;
  stratum?: number | null;
  nProperties?: number | null;
}

export interface KiaLeadsPayload {
  meta: {
    generated?: string;
    source?: string;
    sheet?: string;
    pipeline?: string;
    totalSecondaryLeads?: number;
    secondaryMarketDefinition?: string;
  };
  leads: KiaLead[];
}

export interface KiaOwnerGroup {
  ownerId?: string | null;
  ownerName: string;
  ownerType: string;
  contactStatus: string;
  emailPrimary?: string | null;
  phonePrimary?: string | null;
  city?: string | null;
  vehicles: Array<{
    plate: string;
    model: string;
    year: number;
    service: string;
  }>;
  vehicleCount: number;
}

export interface KiaHeatmapStats {
  unique_points: number;
  cars: number;
  records: number;
  cars_in_bogota: number;
  sectors_with_data: number;
  sectors_total: number;
  top_sector: string;
  top_sector_count: number;
  top_localidad: string;
  top_localidad_count: number;
  n_localidades: number;
  cities: number;
  breaks: number[];
  loc_breaks: number[];
  center: [number, number];
  demo?: string;
  brands: string[];
  year_labels: string[];
  valor_total: number;
  valor_bogota: number;
  cars_con_avaluo: number;
  top_brand: string;
  top_brand_count: number;
}

export interface KiaHeatmapRankingItem {
  localidad: string;
  count: number;
  pct?: number;
  valor?: number;
  top_marca?: string;
  points?: number;
  rank?: number;
  [key: string]: string | number | undefined;
}

/** [lat, lng, cars, quality S|A, label, valor$M, brandSparse, yearSparse] */
export type KiaHeatPoint = [
  number,
  number,
  number,
  string,
  string?,
  number?,
  Array<[number, number]>?,
  Array<[number, number]>?,
];

export type KiaHeatMetric = 'cars' | 'val';
export type KiaHeatQuality = 'all' | 'S' | 'A';

export interface KiaHeatFilters {
  brand: number;
  year: number;
  metric: KiaHeatMetric;
  quality: KiaHeatQuality;
}

export interface KiaHeatmapPayload {
  points: KiaHeatPoint[];
  sectors: GeoJSON.FeatureCollection;
  localidades: GeoJSON.FeatureCollection;
  ranking: KiaHeatmapRankingItem[];
  mb: number[][];
  my: number[][];
  mv: number[];
  mva: number[];
  stats: KiaHeatmapStats;
}
