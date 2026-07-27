'use client';

import type { DataPrediales } from '../types';
import { Accordion } from './Accordion';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

interface PropertyInfoProps {
  data: DataPrediales[] | string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatArea(value: number) {
  return `${value.toFixed(2)} m²`;
}

export function PropertyInfo({ data }: PropertyInfoProps) {
  const isEmpty = typeof data === 'string' || !data || data.length === 0;

  if (isEmpty) {
    return (
      <p className="text-sm text-gray-500">
        No se encontraron propiedades asociadas a la búsqueda
      </p>
    );
  }

  const propiedades = data as DataPrediales[];

  const renderProperty = (property: DataPrediales, idx: number) => (
    <div key={idx} className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a738cd]/10">
          <Building2 className="h-5 w-5 text-[#a738cd]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{property.predirecc}</h3>
          <p className="text-sm text-gray-600">Chip: {property.chip}</p>
          <Badge className="mt-2 bg-[#a738cd] hover:bg-[#a738cd] text-white">
            Estrato {property.estrato}
          </Badge>
        </div>
      </div>

      <DetailGrid
        title="Información básica"
        items={[
          ['Dirección', property.predirecc],
          ['Chip catastral', property.chip],
          ['Código predial', property.barmanpre],
          ['Estrato', String(property.estrato)],
          ['Área construida', formatArea(property.preaconst)],
          ['Uso del suelo', property.precuso],
        ]}
      />

      <DetailGrid
        title="Información catastral"
        items={[
          ['Avalúo catastral', formatCurrency(property.avaluo_catastral)],
          ['Impuesto predial', formatCurrency(property.impuesto_predial)],
          ['Año vigencia', String(property.year)],
          ['Vigencia desde', String(property.desde)],
          ['Vigencia hasta', String(property.hasta)],
          ['Antigüedad', `${property.edad} años`],
        ]}
      />

      <div>
        <h4 className="mb-2 text-sm font-semibold text-purple-800">
          Información financiera
        </h4>
        <div
          className={`mb-3 rounded-md px-3 py-2 text-sm font-medium ${
            property.hipoteca_vigente
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {property.hipoteca_vigente
            ? 'Hipoteca vigente'
            : 'Sin hipoteca vigente'}
        </div>
        <DetailGrid
          title=""
          items={[
            ['Tuvo hipoteca', property.tuvo_hipoteca ? 'Sí' : 'No'],
            ['Hipotecas vigentes', String(property.num_hipotecas_vigentes)],
            ...(property.fecha_ultima_hipoteca
              ? [['Última hipoteca', property.fecha_ultima_hipoteca] as [string, string]]
              : []),
            ['Propiedades activas', String(property.num_propiedades_activas)],
          ]}
        />
      </div>
    </div>
  );

  if (propiedades.length > 1) {
    return (
      <div className="space-y-3">
        {propiedades.map((property, idx) => (
          <Accordion
            key={`${property.chip}-${idx}`}
            title={`${property.predirecc} - Estrato ${property.estrato}`}
            defaultOpen={false}
          >
            {renderProperty(property, idx)}
          </Accordion>
        ))}
      </div>
    );
  }

  return <div className="space-y-3">{propiedades.map(renderProperty)}</div>;
}

function DetailGrid({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <div>
      {title ? (
        <h4 className="mb-2 text-sm font-semibold text-purple-800">{title}</h4>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
          >
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
