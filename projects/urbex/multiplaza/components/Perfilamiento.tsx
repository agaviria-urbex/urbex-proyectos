'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Users,
  TrendingUp,
  MapPin,
  BarChart as BarChartIcon,
  Filter,
  Download,
  Loader2,
} from 'lucide-react';
import type { ApiFilters, ApiResponse } from '../types';
import { fetchPerfilamientoData } from '../services/multiplazaApi';
import { getCachedData } from '../services/cache';
import { ChartWrapper } from './charts/ChartWrapper';
import { CustomBarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MapWithLegend = dynamic(
  () =>
    import('./charts/MapWithLegend').then((mod) => ({
      default: mod.MapWithLegend,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#a738cd]" />
      </div>
    ),
  }
);

const defaultFilters: ApiFilters = {
  segmentacion: 'Localidad',
  dia_semana: 'Todos',
  franja_horaria: 'Todos',
  edad_min: 0,
  edad_max: 120,
  vehiculo_min: 0,
  vehiculo_max: 1000000000,
  prop_min: 0,
  prop_max: 1000000000,
  tiene_propiedades: false,
  barrios: [],
};

interface PerfilamientoProps {
  userEmail: string;
}

export function Perfilamiento({ userEmail }: PerfilamientoProps) {
  const [filters, setFilters] = useState<ApiFilters>(defaultFilters);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const cachedData = getCachedData(filters);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
      const response = await fetchPerfilamientoData(userEmail, filters);
      setData(response);
    } catch (err) {
      let errorMessage = 'Error al cargar los datos';
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
    const cachedData = getCachedData(filters);
    if (cachedData) setData(cachedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = <K extends keyof ApiFilters>(
    key: K,
    value: ApiFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownloadExcel = async () => {
    const excelUrl =
      'https://etl-urbex-public.s3.us-east-2.amazonaws.com/_vehiculos_placas/_placas_multiplaza/_data_multiplaza_excel.xlsx';
    try {
      const response = await fetch(excelUrl);
      if (!response.ok) throw new Error(`Error al descargar: ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'data_multiplaza_excel.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement('a');
      link.href = excelUrl;
      link.download = 'data_multiplaza_excel.xlsx';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-full space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl text-gray-800">
              Análisis de Perfilamiento
            </CardTitle>
            <p className="mt-1 text-sm text-gray-600">
              Análisis demográfico y comportamental del área de influencia de
              Multiplaza
            </p>
          </div>
          <Button variant="outline" onClick={handleDownloadExcel}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="space-y-2">
            <Label>Tipo de segmentación geográfica</Label>
            <Select
              value={filters.segmentacion}
              onValueChange={(value) =>
                handleFilterChange(
                  'segmentacion',
                  value as 'Localidad' | 'Barrio catastral'
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Localidad">Localidad</SelectItem>
                <SelectItem value="Barrio catastral">Barrio catastral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Día de la semana</Label>
            <Select
              value={filters.dia_semana}
              onValueChange={(value) => handleFilterChange('dia_semana', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  'Todos',
                  'Lunes',
                  'Martes',
                  'Miércoles',
                  'Jueves',
                  'Viernes',
                  'Sábado',
                  'Domingo',
                ].map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Franja horaria</Label>
            <Select
              value={filters.franja_horaria}
              onValueChange={(value) =>
                handleFilterChange('franja_horaria', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Todos', 'Mañana', 'Tarde', 'Noche'].map((franja) => (
                  <SelectItem key={franja} value={franja}>
                    {franja}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Edad mínima</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={filters.edad_min}
              onChange={(e) =>
                handleFilterChange('edad_min', parseInt(e.target.value) || 0)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Edad máxima</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={filters.edad_max}
              onChange={(e) =>
                handleFilterChange('edad_max', parseInt(e.target.value) || 120)
              }
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={loadData}
              disabled={loading}
              className="w-full bg-[#a738cd] hover:bg-[#8c2ca3]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Filter className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Cargando...' : 'Filtrar'}
            </Button>
          </div>
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
            <p className="text-gray-600">Cargando datos...</p>
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.labels?.map((kpi, index) => {
              const icons = [Users, MapPin, TrendingUp, BarChartIcon];
              const colors = [
                'text-blue-700',
                'text-[#a738cd]',
                'text-emerald-700',
                'text-indigo-700',
              ];
              const bgColors = [
                'bg-blue-50',
                'bg-purple-50',
                'bg-emerald-50',
                'bg-indigo-50',
              ];
              const borderColors = [
                'border-blue-200',
                'border-purple-200',
                'border-emerald-200',
                'border-indigo-200',
              ];
              const Icon = icons[index] || Users;

              return (
                <Card
                  key={kpi.label}
                  className={`border-2 ${borderColors[index]} shadow-sm`}
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`rounded-full p-3 ${bgColors[index]}`}>
                        <Icon className={`h-6 w-6 ${colors[index]}`} />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="mb-2 text-3xl font-bold text-gray-800">
                        {kpi.value.toLocaleString('es-CO')}
                      </h3>
                      <p className="text-sm font-medium text-gray-600">
                        {kpi.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  Mapa de Perfilamiento Demográfico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-hidden rounded-lg">
                  <MapWithLegend
                    geoData={data.datageometry}
                    centroide={data.centroide}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <ChartWrapper title="Localidades">
                <CustomBarChart
                  data={{
                    labels:
                      data.datalocalidad?.slice(0, 12).map((loc) => loc.locnombre) ||
                      [],
                    values:
                      data.datalocalidad?.slice(0, 12).map((loc) => loc.conteo) ||
                      [],
                  }}
                  title="Localidades"
                  colors={['#a738cd']}
                />
              </ChartWrapper>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ChartWrapper title="Rangos de Edad">
              <CustomBarChart
                data={data.edades || { labels: [], values: [] }}
                title="Rangos de Edad"
                colors={[
                  '#1e40af',
                  '#0f766e',
                  '#059669',
                  '#dc2626',
                  '#ea580c',
                  '#d97706',
                  '#a738cd',
                ]}
              />
            </ChartWrapper>
            <ChartWrapper title="Distribución por Estrato">
              <PieChart
                data={data.estrato || { labels: [], values: [] }}
                title="Distribución por Estrato"
              />
            </ChartWrapper>
            <ChartWrapper title="Número de Propiedades">
              <CustomBarChart
                data={data.numeroPropiedades || { labels: [], values: [] }}
                title="Número de Propiedades"
              />
            </ChartWrapper>
            <ChartWrapper title="Avalúo catastral de las propiedades">
              <CustomBarChart
                data={data.avaluoPropiedades || { labels: [], values: [] }}
                title="Avalúo catastral de las propiedades"
              />
            </ChartWrapper>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <ChartWrapper title="Número de vehículos">
              <CustomBarChart
                data={data.numeroVehiculos || { labels: [], values: [] }}
                title="Número de vehículos"
              />
            </ChartWrapper>
            <ChartWrapper title="Avalúo de los vehículos">
              <CustomBarChart
                data={data.avaluoVehiculo || { labels: [], values: [] }}
                title="Avalúo de los vehículos"
              />
            </ChartWrapper>
            <ChartWrapper title="Tipo de vehículo">
              <CustomBarChart
                data={data.tipoVehiculos || { labels: [], values: [] }}
                title="Tipo de vehículo"
              />
            </ChartWrapper>
          </div>

          <ChartWrapper title="Marca" className="max-h-96">
            <CustomBarChart
              data={data.marcas || { labels: [], values: [] }}
              title="Marca"
              colors={['#a738cd']}
            />
          </ChartWrapper>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartWrapper title="Día de la semana">
              <CustomBarChart
                data={data.diasVisitas || { labels: [], values: [] }}
                title="Día de la semana"
              />
            </ChartWrapper>
            <ChartWrapper title="Horas de visita">
              <CustomBarChart
                data={data.horasVisitas || { labels: [], values: [] }}
                title="Horas de visita"
              />
            </ChartWrapper>
          </div>
        </>
      )}
    </div>
  );
}
