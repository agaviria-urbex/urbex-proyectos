'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Download, Loader2, Search } from 'lucide-react';
import type { KiaLead } from '../types';
import { fetchKiaLeads } from '../services/kiaApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PER_PAGE = 50;
const SVC_COLORS: Record<string, string> = {
  'Trade-in': '#BB162B',
  Warranty: '#2563EB',
  Maintenance: '#93C5FD',
};
const CNT_COLORS: Record<string, string> = {
  'Email + Phone': '#BB162B',
  'Email only': '#1D4ED8',
  'Phone only': '#60A5FA',
  'No contact': '#E2E8F0',
};
const YEAR_COLORS = ['#BFDBFE', '#60A5FA', '#2563EB', '#DC2626', '#BB162B'];
const YEAR_ORDER = ['Pre-2011', '2011-2013', '2014-2016', '2017-2019', '2020-2022'];
const MODEL_PAL = [
  '#BB162B',
  '#DC2626',
  '#EF4444',
  '#F87171',
  '#1D4ED8',
  '#2563EB',
  '#3B82F6',
  '#60A5FA',
  '#93C5FD',
  '#BFDBFE',
];

interface LeadsProps {
  userEmail: string;
}

export function Leads({ userEmail }: LeadsProps) {
  const [leads, setLeads] = useState<KiaLead[]>([]);
  const [generated, setGenerated] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [service, setService] = useState('all');
  const [contact, setContact] = useState('all');
  const [owner, setOwner] = useState('all');
  const [model, setModel] = useState('all');
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKiaLeads(userEmail);
        if (cancelled) return;
        setLeads(data.leads || []);
        setGenerated(data.meta?.generated || '');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error cargando leads');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const models = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((r) => {
      counts[r.modelGroup] = (counts[r.modelGroup] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m);
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return leads.filter((r) => {
      if (
        q &&
        !r.plate?.toLowerCase().includes(q) &&
        !r.ownerName?.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (service !== 'all' && r.serviceTag !== service) return false;
      if (contact !== 'all' && r.contactStatus !== contact) return false;
      if (owner !== 'all' && r.ownerType !== owner) return false;
      if (model !== 'all' && r.modelGroup !== model) return false;
      if (year !== 'all' && r.yearBand !== year) return false;
      return true;
    });
  }, [leads, search, service, contact, owner, model, year]);

  useEffect(() => {
    setPage(1);
  }, [search, service, contact, owner, model, year]);

  const kpis = useMemo(() => {
    const total = leads.length;
    const contactable = leads.filter((r) => r.contactStatus !== 'No contact').length;
    const individuals = leads.filter((r) => r.ownerType === 'Individual').length;
    const companies = leads.filter((r) => r.ownerType === 'Company').length;
    return { total, contactable, individuals, companies };
  }, [leads]);

  const charts = useMemo(() => {
    const modelCounts: Record<string, number> = {};
    const svcCounts: Record<string, number> = {};
    const cntCounts: Record<string, number> = {};
    const yrCounts: Record<string, number> = {};
    leads.forEach((r) => {
      modelCounts[r.modelGroup] = (modelCounts[r.modelGroup] || 0) + 1;
      svcCounts[r.serviceTag] = (svcCounts[r.serviceTag] || 0) + 1;
      cntCounts[r.contactStatus] = (cntCounts[r.contactStatus] || 0) + 1;
      yrCounts[r.yearBand] = (yrCounts[r.yearBand] || 0) + 1;
    });
    const topModels = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const svcOrder = ['Trade-in', 'Warranty', 'Maintenance'];
    const svcLabels = svcOrder.filter((k) => svcCounts[k]);
    const cntOrder = ['Email + Phone', 'Email only', 'Phone only', 'No contact'];
    const cntLabels = cntOrder.filter((k) => cntCounts[k]);
    const yrLabels = YEAR_ORDER.filter((k) => yrCounts[k]);
    return {
      models: {
        labels: topModels.map((e) => e[0]),
        values: topModels.map((e) => e[1]),
      },
      service: {
        labels: svcLabels,
        values: svcLabels.map((k) => svcCounts[k]),
        colors: svcLabels.map((k) => SVC_COLORS[k]),
      },
      contact: {
        labels: cntLabels,
        values: cntLabels.map((k) => cntCounts[k]),
        colors: cntLabels.map((k) => CNT_COLORS[k]),
      },
      years: {
        labels: yrLabels,
        values: yrLabels.map((k) => yrCounts[k]),
        colors: yrLabels.map((k) => YEAR_COLORS[YEAR_ORDER.indexOf(k)]),
      },
    };
  }, [leads]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCSV = () => {
    const cols: Array<[keyof KiaLead | string, string]> = [
      ['plate', 'Plate'],
      ['ownerName', 'Owner'],
      ['modelGroup', 'Model'],
      ['manufactureYear', 'Year'],
      ['ownerType', 'Owner Type'],
      ['contactStatus', 'Contact Status'],
      ['emailPrimary', 'Email'],
      ['phonePrimary', 'Phone'],
      ['city', 'City'],
      ['serviceTag', 'Service Tag'],
      ['outreachPriority', 'Priority'],
      ['gapYears', 'Gap (yrs)'],
      ['stratum', 'Stratum'],
    ];
    const header = cols.map((c) => c[1]).join(',');
    const rows = filtered.map((r) =>
      cols
        .map(([k]) => `"${String((r as unknown as Record<string, unknown>)[k] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob(['\uFEFF' + [header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kia_secondary_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch('');
    setService('all');
    setContact('all');
    setOwner('all');
    setModel('all');
    setYear('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#a738cd]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leads mercado secundario</h2>
          <p className="text-sm text-gray-600">
            Perfilamiento de propietarios de placas KIA
            {generated ? ` · Generado ${generated}` : ''}
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Leads mercado secundario"
          value={kpis.total}
          sub="vehículos KIA identificados"
          primary
        />
        <Kpi
          label="Contactables"
          value={kpis.contactable}
          sub={`${Math.round((kpis.contactable / Math.max(kpis.total, 1)) * 100)}% · email o teléfono`}
        />
        <Kpi
          label="Personas naturales"
          value={kpis.individuals}
          sub="alcance directo al consumidor"
        />
        <Kpi
          label="Empresas / Flota"
          value={kpis.companies}
          sub="objetivos B2B y flotas"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por modelo</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <Bar
              data={{
                labels: charts.models.labels,
                datasets: [
                  {
                    data: charts.models.values,
                    backgroundColor: charts.models.labels.map(
                      (_, i) => MODEL_PAL[Math.min(i, MODEL_PAL.length - 1)]
                    ),
                    borderWidth: 0,
                    borderRadius: 3,
                  },
                ],
              }}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Oportunidad de servicio</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <Doughnut
              data={{
                labels: charts.service.labels,
                datasets: [
                  {
                    data: charts.service.values,
                    backgroundColor: charts.service.colors,
                    borderWidth: 0,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '64%',
                plugins: {
                  legend: { position: 'right' },
                },
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cobertura de contacto</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Doughnut
              data={{
                labels: charts.contact.labels,
                datasets: [
                  {
                    data: charts.contact.values,
                    backgroundColor: charts.contact.colors,
                    borderWidth: 0,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '64%',
                plugins: { legend: { position: 'right' } },
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bandas de antigüedad</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Bar
              data={{
                labels: charts.years.labels,
                datasets: [
                  {
                    data: charts.years.values,
                    backgroundColor: charts.years.colors,
                    borderWidth: 0,
                    borderRadius: 3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Todos los leads</CardTitle>
              <p className="text-sm text-gray-500">
                {filtered.length === leads.length
                  ? `${filtered.length.toLocaleString('es-CO')} leads`
                  : `${filtered.length.toLocaleString('es-CO')} de ${leads.length.toLocaleString('es-CO')} leads`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Limpiar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8"
                placeholder="Buscar por placa o propietario…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <FilterSelect
              value={service}
              onChange={setService}
              placeholder="Servicio"
              options={[
                ['all', 'Todos los servicios'],
                ['Trade-in', 'Trade-in'],
                ['Warranty', 'Garantía'],
                ['Maintenance', 'Mantenimiento'],
              ]}
            />
            <FilterSelect
              value={contact}
              onChange={setContact}
              placeholder="Contacto"
              options={[
                ['all', 'Todos los contactos'],
                ['Email + Phone', 'Email + Tel.'],
                ['Email only', 'Solo Email'],
                ['Phone only', 'Solo Tel.'],
                ['No contact', 'Sin contacto'],
              ]}
            />
            <FilterSelect
              value={owner}
              onChange={setOwner}
              placeholder="Tipo"
              options={[
                ['all', 'Todos los tipos'],
                ['Individual', 'Individual'],
                ['Company', 'Empresa'],
              ]}
            />
            <FilterSelect
              value={model}
              onChange={setModel}
              placeholder="Modelo"
              options={[
                ['all', 'Todos los modelos'],
                ...models.map((m) => [m, m] as [string, string]),
              ]}
            />
            <FilterSelect
              value={year}
              onChange={setYear}
              placeholder="Año"
              options={[
                ['all', 'Todas las bandas'],
                ...YEAR_ORDER.map((y) => [y, y] as [string, string]),
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  'Placa',
                  'Propietario',
                  'Modelo',
                  'Año',
                  'Tipo',
                  'Contacto',
                  'Email',
                  'Teléfono',
                  'Ciudad',
                  'Servicio',
                  'Prioridad',
                ].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-gray-500">
                    No hay leads con los filtros actuales
                  </td>
                </tr>
              ) : (
                slice.map((r) => (
                  <tr key={`${r.plate}-${r.ownerName}`} className="border-b">
                    <td className="px-3 py-2 font-medium">{r.plate}</td>
                    <td className="px-3 py-2">{r.ownerName || '—'}</td>
                    <td className="px-3 py-2">{r.modelGroup}</td>
                    <td className="px-3 py-2">{r.manufactureYear}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary">{r.ownerType}</Badge>
                    </td>
                    <td className="px-3 py-2">{r.contactStatus}</td>
                    <td className="px-3 py-2 text-xs">{r.emailPrimary || '—'}</td>
                    <td className="px-3 py-2">{r.phonePrimary || '—'}</td>
                    <td className="px-3 py-2">{r.city || '—'}</td>
                    <td className="px-3 py-2">{r.serviceTag}</td>
                    <td className="px-3 py-2">{r.outreachPriority || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Página {page} de {pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  primary,
}: {
  label: string;
  value: number;
  sub: string;
  primary?: boolean;
}) {
  return (
    <Card className={primary ? 'border-[#a738cd]/30 bg-purple-50/40' : ''}>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {value.toLocaleString('es-CO')}
        </p>
        <p className="mt-1 text-xs text-gray-500">{sub}</p>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<[string, string]>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
