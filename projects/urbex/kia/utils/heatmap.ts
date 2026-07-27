import type {
  KiaHeatFilters,
  KiaHeatmapPayload,
  KiaHeatPoint,
} from '../types';

export const REDS = [
  '#FFFFB2',
  '#FED976',
  '#FEB24C',
  '#FD8D3C',
  '#F03B20',
  '#BD0026',
];

export function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  return Math.round(Number(n)).toLocaleString('es-CO');
}

export function fmtV(n: number | null | undefined): string {
  return `$ ${Math.round(Number(n)).toLocaleString('es-CO')} M`;
}

export function quantile(arr: number[], q: number): number {
  if (!arr.length) return 1;
  const s = [...arr].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const b = Math.floor(pos);
  return s[b + 1] !== undefined
    ? s[b] + (pos - b) * (s[b + 1] - s[b])
    : s[b];
}

export function makeBreaks(vals: number[]): number[] {
  const pos = vals.filter((v) => v > 0);
  if (pos.length < 5) {
    const m = Math.max(1, ...pos, 1);
    return [1, m * 0.25, m * 0.5, m * 0.75, m];
  }
  const qs = [0, 0.2, 0.4, 0.6, 0.8, 1].map((q) => quantile(pos, q));
  return Array.from(new Set(qs.map((v) => Math.round(v))));
}

export function rampColor(c: number, br: number[]): string | null {
  if (c <= 0) return null;
  for (let i = br.length - 1; i >= 1; i--) {
    if (c >= br[i - 1]) return REDS[Math.min(REDS.length - 1, i - 1)];
  }
  return REDS[0];
}

export function hasDims(data: KiaHeatmapPayload): boolean {
  const S = data.stats;
  return !!(S.brands?.length && data.mb?.length);
}

export function brandsList(data: KiaHeatmapPayload): string[] {
  return hasDims(data) ? [...data.stats.brands, 'OTRAS'] : [];
}

export function yearsList(data: KiaHeatmapPayload): string[] {
  return hasDims(data) ? data.stats.year_labels : [];
}

export function locNames(data: KiaHeatmapPayload): string[] {
  return (data.ranking || []).map((r) => r.localidad);
}

export function selValues(
  data: KiaHeatmapPayload,
  st: KiaHeatFilters
): { vals: number[]; unit: 'carros' | '$M'; tag: string } {
  const LOCS = locNames(data);
  const BRANDS = brandsList(data);
  const YEARS = yearsList(data);
  const dims = hasDims(data);

  if (dims && st.brand >= 0) {
    return {
      vals: LOCS.map((_, i) => data.mb[i][st.brand] || 0),
      unit: 'carros',
      tag: BRANDS[st.brand],
    };
  }
  if (dims && st.year >= 0) {
    return {
      vals: LOCS.map((_, i) => data.my[i][st.year] || 0),
      unit: 'carros',
      tag: YEARS[st.year],
    };
  }
  if (dims && st.metric === 'val') {
    return {
      vals: LOCS.map((_, i) => data.mv[i] || 0),
      unit: '$M',
      tag: 'Valor avalúos',
    };
  }
  return {
    vals: (data.ranking || []).map((r) => r.count),
    unit: 'carros',
    tag: '',
  };
}

export function pointWeight(
  p: KiaHeatPoint,
  st: KiaHeatFilters,
  dims: boolean
): number {
  if (dims && st.brand >= 0) {
    const e = (p[6] || []).find((x) => x[0] === st.brand);
    return e ? e[1] : 0;
  }
  if (dims && st.year >= 0) {
    const e = (p[7] || []).find((x) => x[0] === st.year);
    return e ? e[1] : 0;
  }
  if (dims && st.metric === 'val') return p[5] || 0;
  return p[2];
}

export function coverage(data: KiaHeatmapPayload) {
  const RANK0 = data.ranking || [];
  const BRANDS = brandsList(data);
  const YEARS = yearsList(data);
  const carsBog = RANK0.reduce((a, r) => a + r.count, 0);
  const brandTotals = hasDims(data)
    ? BRANDS.map((_, b) => data.mb.reduce((a, row) => a + (row[b] || 0), 0))
    : [];
  const yearTotals = hasDims(data)
    ? YEARS.map((_, y) => data.my.reduce((a, row) => a + (row[y] || 0), 0))
    : [];
  const knownB = brandTotals.reduce((a, b) => a + b, 0);
  const knownY = yearTotals.reduce((a, b) => a + b, 0);
  const S = data.stats;
  return {
    carsBog,
    knownB,
    knownY,
    brandTotals,
    yearTotals,
    covB: carsBog ? Math.round((knownB / carsBog) * 100) : 0,
    covY: carsBog ? Math.round((knownY / carsBog) * 100) : 0,
    covValPct: S.cars
      ? Math.round(((S.cars_con_avaluo || 0) / S.cars) * 100)
      : 0,
  };
}

export function normSearch(s: string): string {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

export const DEFAULT_FILTERS: KiaHeatFilters = {
  brand: -1,
  year: -1,
  metric: 'cars',
  quality: 'all',
};
