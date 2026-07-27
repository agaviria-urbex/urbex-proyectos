'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { KiaHeatFilters, KiaHeatmapPayload } from '../../types';
import { fetchKiaHeatmap } from '../../services/kiaApi';
import {
  DEFAULT_FILTERS,
  brandsList,
  coverage,
  fmt,
  fmtV,
  hasDims,
  locNames,
  makeBreaks,
  rampColor,
  selValues,
  yearsList,
} from '../../utils/heatmap';
import { HeatmapFilters, type LayerToggles } from './HeatmapFilters';
import { HeatmapAnalysis } from './HeatmapAnalysis';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const HeatmapMap = dynamic(
  () => import('./HeatmapMap').then((m) => m.HeatmapMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-lg border bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#a738cd]" />
      </div>
    ),
  }
);

interface HeatmapProps {
  userEmail: string;
}

type SubView = 'map' | 'analysis';

const DEFAULT_LAYERS: LayerToggles = {
  loc: true,
  heat: true,
  sec: false,
  points: false,
  bounds: false,
};

export function Heatmap({ userEmail }: HeatmapProps) {
  const [data, setData] = useState<KiaHeatmapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<SubView>('map');
  const [filters, setFilters] = useState<KiaHeatFilters>(DEFAULT_FILTERS);
  const [layers, setLayers] = useState<LayerToggles>(DEFAULT_LAYERS);
  const [basemap, setBasemap] = useState('light');
  const [search, setSearch] = useState('');
  const [searchToken, setSearchToken] = useState(0);
  const mapApiRef = useRef<{
    fitLocalidad: (name: string) => void;
    invalidate: () => void;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchKiaHeatmap(userEmail);
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Error cargando mapa de calor'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  useEffect(() => {
    if (view === 'map') {
      setTimeout(() => mapApiRef.current?.invalidate(), 80);
    }
  }, [view]);

  const dims = data ? hasDims(data) : false;
  const BRANDS = data ? brandsList(data) : [];
  const YEARS = data ? yearsList(data) : [];
  const LOCS = data ? locNames(data) : [];
  const cov = data ? coverage(data) : null;
  const CUR = data ? selValues(data, filters) : null;
  const CUR_BR = CUR ? makeBreaks(CUR.vals) : [];

  const filterNote = useMemo(() => {
    if (!cov) return '';
    if (filters.brand >= 0)
      return `Filtro ${BRANDS[filters.brand]} — solo carros con marca registrada (${cov.covB}% de Bogotá)`;
    if (filters.year >= 0)
      return `Filtro ${YEARS[filters.year]} — solo carros con año registrado (${cov.covY}% de Bogotá)`;
    if (filters.metric === 'val')
      return `Valor de avalúos en $M COP — cobertura ${cov.covValPct}% de los carros`;
    return '';
  }, [filters, BRANDS, YEARS, cov]);

  const kpis = useMemo(() => {
    if (!data || !CUR || !cov) return null;
    const tot = CUR.vals.reduce((a, b) => a + b, 0);
    let iMax = 0;
    CUR.vals.forEach((v, i) => {
      if (v > CUR.vals[iMax]) iMax = i;
    });
    const S = data.stats;
    const selLabel =
      filters.brand >= 0
        ? `Carros · ${BRANDS[filters.brand]}`
        : filters.year >= 0
          ? `Carros · ${YEARS[filters.year]}`
          : filters.metric === 'val'
            ? 'Valor avalúos (Bogotá)'
            : 'Carros en Bogotá';
    const sub1 =
      filters.brand >= 0
        ? `solo marca conocida: ${fmt(cov.knownB)} de ${fmt(cov.carsBog)} (${cov.covB}%)`
        : filters.year >= 0
          ? `solo año conocido: ${fmt(cov.knownY)} de ${fmt(cov.carsBog)} (${cov.covY}%)`
          : filters.metric === 'val'
            ? `millones COP · cobertura ${cov.covValPct}%`
            : `${S.n_localidades} localidades`;
    return [
      {
        label: selLabel,
        value: CUR.unit === '$M' ? fmtV(tot) : fmt(tot),
        sub: sub1,
        accent: true,
      },
      {
        label: 'Localidad líder',
        value: CUR.unit === '$M' ? fmtV(CUR.vals[iMax] || 0) : fmt(CUR.vals[iMax] || 0),
        sub: LOCS[iMax] || '—',
      },
      {
        label: 'Carros mapeados',
        value: fmt(S.cars),
        sub: `${fmt(S.unique_points)} ubicaciones únicas`,
      },
      {
        label: 'Valor registrado',
        value: fmtV(S.valor_total || 0),
        sub: `$M COP · ${fmt(S.cars_con_avaluo || 0)} con avalúo (${cov.covValPct}%)`,
      },
    ];
  }, [data, CUR, cov, filters, BRANDS, YEARS, LOCS]);

  const rankOrder = useMemo(() => {
    if (!CUR) return [];
    return LOCS.map((n, i) => ({ n, i, v: CUR.vals[i] })).sort(
      (a, b) => b.v - a.v
    );
  }, [CUR, LOCS]);

  const topChart = useMemo(() => {
    if (!CUR) return null;
    const top = rankOrder.slice(0, 10);
    return {
      labels: top.map((o) => o.n),
      vals: top.map((o) => o.v),
      cols: top.map((o) => rampColor(o.v, CUR_BR) || '#E8E8E8'),
    };
  }, [CUR, rankOrder, CUR_BR]);

  const yearChart = useMemo(() => {
    if (!dims || !cov) return null;
    return {
      labels: [...YEARS, 'S/D'],
      vals: [
        ...cov.yearTotals,
        Math.max(0, cov.carsBog - cov.knownY),
      ],
      colors: [
        ...YEARS.map((_, i) => REDS_YEAR[i] || '#C9CFD6'),
        '#EDEDED',
      ],
      borders: [
        ...YEARS.map((_, i) => (i === filters.year ? '#111' : 'rgba(0,0,0,.10)')),
        'rgba(0,0,0,.10)',
      ],
      borderW: [
        ...YEARS.map((_, i) => (i === filters.year ? 2.5 : 1)),
        1,
      ],
    };
  }, [dims, cov, YEARS, filters.year]);

  const onExportCsv = useCallback(() => {
    if (!data || !CUR || !cov) return;
    const order = rankOrder;
    const tot = CUR.vals.reduce((a, b) => a + b, 0) || 1;
    const dec = (v: number | string) => String(v).replace('.', ',');
    const isVal = CUR.unit === '$M';
    const note = isVal
      ? `"Valor de avalúos en millones de COP · cobertura ${cov.covValPct}%"`
      : filters.brand >= 0
        ? `"Filtro ${BRANDS[filters.brand]} · marca registrada (${cov.covB}%)"`
        : filters.year >= 0
          ? `"Filtro ${YEARS[filters.year]} · año registrado (${cov.covY}%)"`
          : '"Carros únicos (placa) por localidad · Bogotá D.C."';
    const head = [
      'Puesto',
      'Localidad',
      isVal ? 'Valor $M COP' : `Carros${CUR.tag ? ` (${CUR.tag})` : ''}`,
      '%',
      ...(isVal
        ? ['Carros (total)', 'Marca top']
        : ['Carros (total)', 'Valor $M COP (total)', 'Marca top']),
    ];
    const lines = order.map((o, k) => {
      const r = data.ranking[o.i];
      const base = [k + 1, `"${o.n}"`, dec(o.v), dec(((o.v / tot) * 100).toFixed(1))];
      return (
        isVal
          ? base.concat([r.count, `"${r.top_marca || ''}"`])
          : base.concat([r.count, dec(r.valor || 0), `"${r.top_marca || ''}"`])
      ).join(';');
    });
    const csv = '\uFEFF' + note + '\n' + head.join(';') + '\n' + lines.join('\n');
    const suffix =
      filters.brand >= 0
        ? `_${BRANDS[filters.brand]}`
        : filters.year >= 0
          ? `_${YEARS[filters.year]}`
          : isVal
            ? '_valor'
            : '';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download =
      `ranking_localidades${suffix}`.replace(/[^A-Za-z0-9_]/g, '_') + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [data, CUR, cov, rankOrder, filters, BRANDS, YEARS]);

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setLayers(DEFAULT_LAYERS);
    setBasemap('light');
    setSearch('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#a738cd]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Sin datos'}</AlertDescription>
      </Alert>
    );
  }

  const S = data.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mapa de calor</h2>
          <p className="text-sm text-gray-600">
            Densidad de vehículos KIA geocodificados en Bogotá
            {S.demo ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                DATOS DE PRUEBA
              </span>
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>
              <strong className="text-gray-900">{fmt(S.cars)}</strong> carros
              únicos
            </span>
            <span>
              <strong className="text-gray-900">{fmt(S.cars_in_bogota)}</strong>{' '}
              en Bogotá
            </span>
            <span>
              Líder:{' '}
              <strong className="text-gray-900">{S.top_localidad || '—'}</strong>
            </span>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border bg-white p-1">
          {(
            [
              ['map', 'Mapa'],
              ['analysis', 'Análisis'],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={view === id ? 'default' : 'ghost'}
              className={
                view === id ? 'bg-[#a738cd] hover:bg-[#8c2ca3]' : ''
              }
              onClick={() => setView(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {view === 'map' ? (
        <>
          <HeatmapFilters
            filters={filters}
            brands={BRANDS}
            years={YEARS}
            hasDims={dims}
            layers={layers}
            basemap={basemap}
            search={search}
            searchOptions={[
              ...LOCS,
              ...(data.sectors?.features || [])
                .map(
                  (f) =>
                    (f.properties as { SCANOMBRE?: string })?.SCANOMBRE || ''
                )
                .filter(Boolean),
            ]}
            filterNote={filterNote}
            onFiltersChange={(next) =>
              setFilters((prev) => ({ ...prev, ...next }))
            }
            onLayersChange={(next) =>
              setLayers((prev) => ({ ...prev, ...next }))
            }
            onBasemapChange={setBasemap}
            onSearchChange={setSearch}
            onSearchSubmit={() => setSearchToken((t) => t + 1)}
            onReset={resetAll}
            onExportCsv={onExportCsv}
          />

          {kpis && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((k) => (
                <Card
                  key={k.label}
                  className={cn(k.accent && 'border-[#a738cd]/40')}
                >
                  <CardContent className="p-4">
                    <p className="text-xs uppercase text-gray-500">{k.label}</p>
                    <p
                      className={cn(
                        'mt-1 text-2xl font-bold',
                        k.accent && 'text-[#a738cd]'
                      )}
                    >
                      {k.value}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{k.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
            <div className="space-y-2">
              <HeatmapMap
                data={data}
                filters={filters}
                layers={layers}
                basemap={basemap}
                searchQuery={search}
                searchToken={searchToken}
                onReady={(api) => {
                  mapApiRef.current = api;
                }}
              />
              {CUR_BR.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium text-gray-800">
                    {CUR?.unit === '$M'
                      ? 'Valor por localidad ($M)'
                      : 'Carros por localidad'}
                    {CUR?.tag && filters.metric !== 'val'
                      ? ` · ${CUR.tag}`
                      : ''}
                    :
                  </span>
                  {CUR_BR.slice(0, -1).map((lo, i) => (
                    <span key={`${lo}-${i}`} className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{
                          background:
                            ['#FFFFB2', '#FED976', '#FEB24C', '#FD8D3C', '#F03B20', '#BD0026'][
                              Math.min(5, i)
                            ],
                        }}
                      />
                      {fmt(lo)}–{fmt(CUR_BR[i + 1])}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Card className="max-h-[520px] overflow-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Localidades · de mayor a menor
                </CardTitle>
                <p className="text-xs text-gray-500">
                  {CUR?.unit === '$M'
                    ? `Avalúos en $M COP (cobertura ${cov?.covValPct}%)`
                    : `Carros${CUR?.tag ? ` · ${CUR.tag}` : ''}`}{' '}
                  — clic para ver en el mapa
                </p>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                {(() => {
                  const mx = Math.max(1, rankOrder[0]?.v || 1);
                  const tot = CUR?.vals.reduce((a, b) => a + b, 0) || 1;
                  return rankOrder.map((o, k) => {
                    const col = rampColor(o.v, CUR_BR) || '#E8E8E8';
                    const w = Math.max(2, Math.round((o.v / mx) * 100));
                    return (
                      <button
                        key={o.n}
                        type="button"
                        className={cn(
                          'grid w-full grid-cols-[1.5rem_1fr_4rem] items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-gray-50',
                          k < 3 && 'font-semibold'
                        )}
                        onClick={() => mapApiRef.current?.fitLocalidad(o.n)}
                      >
                        <span className="text-xs text-gray-500">{k + 1}</span>
                        <div className="min-w-0">
                          <div className="truncate">{o.n}</div>
                          <div
                            className="mt-1 h-1.5 rounded"
                            style={{ width: `${w}%`, background: col }}
                          />
                        </div>
                        <div className="text-right">
                          <div>
                            {CUR?.unit === '$M' ? fmtV(o.v) : fmt(o.v)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {((o.v / tot) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {topChart && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Top 10 localidades
                    {CUR?.unit === '$M' ? ' · valor $M COP' : ''}
                    {CUR?.tag && filters.metric !== 'val'
                      ? ` · ${CUR.tag}`
                      : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <Bar
                    data={{
                      labels: topChart.labels,
                      datasets: [
                        {
                          data: topChart.vals,
                          backgroundColor: topChart.cols,
                          borderRadius: 3,
                        },
                      ],
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (c) =>
                              ` ${
                                CUR?.unit === '$M'
                                  ? fmtV(Number(c.raw))
                                  : `${fmt(Number(c.raw))} carros`
                              }`,
                          },
                        },
                      },
                      onClick: (_e, els) => {
                        if (els.length) {
                          const n = topChart.labels[els[0].index];
                          mapApiRef.current?.fitLocalidad(n);
                        }
                      },
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {yearChart && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Distribución por año
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <Bar
                    data={{
                      labels: yearChart.labels,
                      datasets: [
                        {
                          data: yearChart.vals,
                          backgroundColor: yearChart.colors,
                          borderColor: yearChart.borders,
                          borderWidth: yearChart.borderW,
                          borderRadius: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (c) =>
                              ` ${fmt(Number(c.raw))} carros${
                                c.label === 'S/D'
                                  ? ' (año no registrado)'
                                  : ''
                              }`,
                          },
                        },
                      },
                      onClick: (_e, els) => {
                        if (els.length && els[0].index < YEARS.length) {
                          const i = els[0].index;
                          setFilters((prev) => ({
                            ...prev,
                            year: prev.year === i ? -1 : i,
                            brand: -1,
                            metric: 'cars',
                          }));
                        }
                      },
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <p className="text-xs text-gray-500">
            {fmt(S.unique_points)} ubicaciones geocodificadas · cobertura
            marca/año ~{cov?.covB}% · avalúo {cov?.covValPct}%
          </p>
        </>
      ) : (
        <HeatmapAnalysis data={data} />
      )}
    </div>
  );
}

const REDS_YEAR = ['#FED976', '#FEB24C', '#FD8D3C', '#F03B20', '#BD0026'];
