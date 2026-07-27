'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KiaHeatmapPayload } from '../../types';
import {
  REDS,
  brandsList,
  coverage,
  fmt,
  hasDims,
  locNames,
  yearsList,
} from '../../utils/heatmap';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface HeatmapAnalysisProps {
  data: KiaHeatmapPayload;
}

export function HeatmapAnalysis({ data }: HeatmapAnalysisProps) {
  const dims = hasDims(data);
  const LOCS = locNames(data);
  const BRANDS = brandsList(data);
  const YEARS = yearsList(data);
  const { knownB, knownY } = coverage(data);
  const RANK0 = data.ranking || [];

  const xtab = useMemo(() => {
    if (!dims || knownB <= 0) return null;
    const rows = LOCS.map((n, i) => ({ n, i })).filter(
      (r) => RANK0[r.i].count > 0
    );
    if (!rows.length) return null;
    const colMax = BRANDS.map((_, b) =>
      Math.max(1, ...rows.map((r) => data.mb[r.i][b] || 0))
    );
    return { rows, colMax };
  }, [dims, knownB, LOCS, BRANDS, RANK0, data.mb]);

  const ageRows = useMemo(() => {
    if (!dims || knownY <= 0) return [];
    return LOCS.map((n, i) => ({
      n,
      i,
      tot: data.my[i].reduce((a, b) => a + b, 0),
    }))
      .sort((a, b) => b.tot - a.tot)
      .slice(0, 12)
      .filter((r) => r.tot > 0);
  }, [dims, knownY, LOCS, data.my]);

  const avgRows = useMemo(() => {
    if (!dims || !data.mva?.some((v) => v > 0)) return [];
    const MIN_N = 30;
    return LOCS.map((n, i) => ({
      n,
      avg:
        (data.mva[i] || 0) >= MIN_N ? data.mv[i] / data.mva[i] : null,
      na: data.mva[i] || 0,
    }))
      .filter((r) => r.avg != null)
      .sort((a, b) => (b.avg || 0) - (a.avg || 0))
      .slice(0, 12) as Array<{ n: string; avg: number; na: number }>;
  }, [dims, LOCS, data.mva, data.mv]);

  const sectors = useMemo(() => {
    return (data.sectors?.features || [])
      .map((f) => f.properties as { SCANOMBRE?: string; count?: number })
      .filter((p) => (p.count || 0) > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 20);
  }, [data.sectors]);

  const anyVisible =
    xtab || ageRows.length || avgRows.length || sectors.length;
  if (!anyVisible) {
    return (
      <p className="text-sm text-gray-500">
        No hay paneles de análisis disponibles para estos datos.
      </p>
    );
  }

  const ageCols = REDS.slice(1);
  const cellInk = (ci: number) => (ci >= 4 ? '#fff' : '#111');

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">¿Cómo leerlo?</span>{' '}
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: REDS[1] }}
          />
          Claro = carro viejo → prospecto de retoma
        </span>
        {' · '}
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: REDS[5] }}
          />
          Oscuro = casi nuevo → posventa
        </span>
      </p>

      {xtab && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Matriz localidad × marca
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1">Localidad</th>
                  {BRANDS.map((b) => (
                    <th key={b} className="px-1 py-1 text-center">
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {xtab.rows.map((r) => (
                  <tr key={r.n} className="border-b">
                    <td className="px-2 py-1 font-medium">{r.n}</td>
                    {BRANDS.map((b, bi) => {
                      const v = data.mb[r.i][bi] || 0;
                      const ci =
                        v <= 0
                          ? -1
                          : Math.min(
                              REDS.length - 1,
                              Math.floor((v / xtab.colMax[bi]) * REDS.length)
                            );
                      const bg = ci < 0 ? 'transparent' : REDS[ci];
                      return (
                        <td key={b} className="px-1 py-1 text-center">
                          <span
                            className="inline-block min-w-[2.5rem] rounded px-1 py-0.5"
                            style={{
                              background: bg,
                              color: ci < 0 ? '#CCC' : cellInk(ci),
                            }}
                            title={`${b} en ${r.n}: ${fmt(v)} carros`}
                          >
                            {v ? fmt(v) : '·'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {ageRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Edad de flota · top localidades
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <Bar
              data={{
                labels: ageRows.map((r) => r.n),
                datasets: YEARS.map((y, yi) => ({
                  label: y,
                  data: ageRows.map((r) => data.my[r.i][yi] || 0),
                  backgroundColor: ageCols[yi],
                  borderColor: '#fff',
                  borderWidth: 1.5,
                })),
              }}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 10 } },
                  tooltip: {
                    callbacks: {
                      label: (c) =>
                        ` ${c.dataset.label}: ${fmt(Number(c.raw))} carros`,
                    },
                  },
                },
                scales: {
                  x: { stacked: true, ticks: { callback: (v) => fmt(Number(v)) } },
                  y: { stacked: true },
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {avgRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Avalúo promedio por localidad ($M COP)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <Bar
              data={{
                labels: avgRows.map((r) => r.n),
                datasets: [
                  {
                    data: avgRows.map((r) => +r.avg.toFixed(1)),
                    backgroundColor: '#BB162B',
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
                      label: (c) => {
                        const r = avgRows[c.dataIndex];
                        return ` $ ${Number(c.raw).toLocaleString('es-CO')} M COP · ${fmt(r.na)} carros`;
                      },
                    },
                  },
                },
                scales: {
                  x: { ticks: { callback: (v) => `$${v}` } },
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {sectors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 20 sectores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(() => {
              const mx = Math.max(1, sectors[0]?.count || 1);
              return sectors.map((p, k) => (
                <div
                  key={`${p.SCANOMBRE}-${k}`}
                  className="grid grid-cols-[2rem_1fr_4rem] items-center gap-2 text-sm"
                >
                  <span className="text-xs text-gray-500">{k + 1}</span>
                  <div>
                    <div className="font-medium">{p.SCANOMBRE}</div>
                    <div
                      className="mt-1 h-1.5 rounded"
                      style={{
                        width: `${Math.max(2, Math.round(((p.count || 0) / mx) * 100))}%`,
                        background: '#BB162B',
                      }}
                    />
                  </div>
                  <div className="text-right font-semibold">
                    {fmt(p.count)}
                  </div>
                </div>
              ));
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
