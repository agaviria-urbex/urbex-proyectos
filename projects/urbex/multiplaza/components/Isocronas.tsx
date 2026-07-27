'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Clock, Users, Building, DollarSign, Loader2 } from 'lucide-react';
import type { IsochroneData, IsochroneFilters } from '../types';
import { fetchIsochroneData } from '../services/multiplazaApi';
import { getCachedIsochroneData } from '../services/cache';
import { ChartWrapper } from './charts/ChartWrapper';
import { CustomBarChart } from './charts/BarChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const IsochroneMap = dynamic(
  () =>
    import('./charts/IsochroneMap').then((mod) => ({
      default: mod.IsochroneMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#a738cd]" />
      </div>
    ),
  }
);

const defaultFilters: IsochroneFilters = { isocrona: '15' };

const timeZones = [
  { time: '5 min', value: '5', color: 'bg-red-500' },
  { time: '10 min', value: '10', color: 'bg-orange-500' },
  { time: '15 min', value: '15', color: 'bg-green-500' },
];

interface IsocronasProps {
  userEmail: string;
}

export function Isocronas({ userEmail }: IsocronasProps) {
  const [filters, setFilters] = useState<IsochroneFilters>(defaultFilters);
  const [data, setData] = useState<IsochroneData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const cachedData = getCachedIsochroneData(filters);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
      const response = await fetchIsochroneData(userEmail, filters);
      setData(response);
    } catch (err) {
      let errorMessage = 'Error al cargar los datos de isocronas';
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          errorMessage =
            'Error de conexión: No se pudo conectar con la API.';
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = getCachedIsochroneData(filters);
    if (cachedData) setData(cachedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="max-w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800">
            Análisis de Isocronas
          </CardTitle>
          <p className="text-sm text-gray-600">
            Análisis de accesibilidad territorial y tiempo de desplazamiento a
            Multiplaza
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 items-end gap-4 pt-6 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Tiempo de Isocrona</Label>
            <Select
              value={filters.isocrona}
              onValueChange={(value) =>
                setFilters({ isocrona: value as '5' | '10' | '15' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="10">10 minutos</SelectItem>
                <SelectItem value="15">15 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            {timeZones.map((zone) => (
              <div key={zone.value} className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded ${zone.color}`} />
                <span className="text-sm text-gray-600">{zone.time}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={loadData}
            disabled={loading}
            className="bg-[#a738cd] hover:bg-[#8c2ca3]"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Clock className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Cargando...' : 'Aplicar'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#a738cd]" />
            <p className="text-gray-600">Cargando datos de isocronas...</p>
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Users}
              value={data.placas.toLocaleString('es-CO')}
              label="Placas Registradas"
              border="border-blue-200"
              bg="bg-blue-50"
              color="text-blue-700"
            />
            <KpiCard
              icon={DollarSign}
              value={formatCurrency(data.valorcomercial)}
              label="Valor Comercial Promedio"
              border="border-purple-200"
              bg="bg-purple-50"
              color="text-[#a738cd]"
              compact
            />
            <KpiCard
              icon={Clock}
              value={filters.isocrona}
              label="Minutos de Isocrona"
              border="border-emerald-200"
              bg="bg-emerald-50"
              color="text-emerald-700"
            />
            <KpiCard
              icon={Building}
              value={data.clasificacion.values
                .reduce((a, b) => a + b, 0)
                .toLocaleString('es-CO')}
              label="Total Inmuebles"
              border="border-indigo-200"
              bg="bg-indigo-50"
              color="text-indigo-700"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Mapa de Isocrona - {filters.isocrona} minutos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IsochroneMap
                geometry={data.geometry}
                centroide={data.centroide}
                className="h-96"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartWrapper title="Distribución por Estrato">
              <CustomBarChart
                data={data.estrato || { labels: [], values: [] }}
                title="Distribución por Estrato"
                colors={['#1E3A8A', '#06B6D4', '#a738cd', '#22C55E', '#64748B']}
              />
            </ChartWrapper>
            <ChartWrapper title="Clasificación de Inmuebles">
              <CustomBarChart
                data={{
                  labels: data.clasificacion?.labels || [],
                  values: data.clasificacion?.values || [],
                }}
                title="Clasificación de Inmuebles"
                colors={['#a738cd']}
              />
            </ChartWrapper>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartWrapper title="Marcas de Vehículos">
              <CustomBarChart
                data={data.marcas || { labels: [], values: [] }}
                title="Marcas de Vehículos"
              />
            </ChartWrapper>
            <ChartWrapper title="Modelos de Vehículos">
              <CustomBarChart
                data={data.modelo || { labels: [], values: [] }}
                title="Modelos de Vehículos"
              />
            </ChartWrapper>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Resumen del Análisis de Isocrona - {filters.isocrona} minutos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h5 className="mb-3 font-medium text-gray-800">
                  Características del Área
                </h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    • {data.placas.toLocaleString('es-CO')} vehículos registrados
                    en la zona
                  </li>
                  <li>
                    • Valor comercial promedio:{' '}
                    {formatCurrency(data.valorcomercial)}
                  </li>
                  <li>
                    •{' '}
                    {data.clasificacion.values
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString('es-CO')}{' '}
                    inmuebles totales
                  </li>
                  <li>
                    • Predominancia de estrato {data.estrato.labels[0]} en la
                    zona
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="mb-3 font-medium text-gray-800">
                  Perfil Vehicular
                </h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    • Marca más común: {data.marcas.labels[0]} (
                    {data.marcas.values[0]?.toLocaleString('es-CO')} vehículos)
                  </li>
                  <li>
                    • Modelo más frecuente: {data.modelo.labels[0]} (
                    {data.modelo.values[0]?.toLocaleString('es-CO')} vehículos)
                  </li>
                  <li>
                    • Tipo de inmueble predominante:{' '}
                    {data.clasificacion.labels[0]}
                  </li>
                  <li>
                    • Área de influencia de {filters.isocrona} minutos de
                    desplazamiento
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  value,
  label,
  border,
  bg,
  color,
  compact,
}: {
  icon: typeof Users;
  value: string;
  label: string;
  border: string;
  bg: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <Card className={`border-2 ${border} shadow-sm`}>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className={`rounded-full p-3 ${bg}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
        <div className="text-center">
          <h3
            className={`mb-2 font-bold text-gray-800 ${
              compact ? 'text-2xl' : 'text-3xl'
            }`}
          >
            {value}
          </h3>
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
