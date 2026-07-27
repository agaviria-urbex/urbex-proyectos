'use client';

import { Accordion } from './Accordion';
import { FileText } from 'lucide-react';

type DataTransaccion = Record<string, unknown>;

interface TransactionInfoProps {
  data: DataTransaccion[] | string;
}

function formatCurrency(value: number | string) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numValue)) return 'N/A';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(numValue);
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function TransactionInfo({ data }: TransactionInfoProps) {
  const isEmpty = typeof data === 'string' || !data || data.length === 0;

  if (isEmpty) {
    return (
      <p className="text-sm text-gray-500">
        No se encontraron transacciones asociadas a la búsqueda
      </p>
    );
  }

  const transacciones = data as DataTransaccion[];
  const transaccionesAgrupadas: Record<string, DataTransaccion[]> = {};
  const transaccionesSinMatricula: DataTransaccion[] = [];

  transacciones.forEach((t) => {
    const matricula = asString(
      t.matricula_inmobiliaria || t.matricula || t.numeroMatricula || t.mat_inmobiliaria
    );
    if (matricula) {
      if (!transaccionesAgrupadas[matricula]) transaccionesAgrupadas[matricula] = [];
      transaccionesAgrupadas[matricula].push(t);
    } else {
      transaccionesSinMatricula.push(t);
    }
  });

  const gruposTransacciones = [
    ...Object.entries(transaccionesAgrupadas).map(([matricula, trans]) => ({
      matricula: matricula as string | null,
      transacciones: trans,
    })),
    ...transaccionesSinMatricula.map((t) => ({
      matricula: null as string | null,
      transacciones: [t],
    })),
  ];

  const renderTransactionGroup = (
    grupo: (typeof gruposTransacciones)[0],
    idx: number
  ) => {
    const first = grupo.transacciones[0];
    const tipoDocumento = asString(
      first.tipo_documento || first.tipoDocumento || first.tipo || 'Transacción'
    );
    const numeroDocumento = asString(
      first.numero_documento || first.numeroDocumento || first.radicado || ''
    );
    const direccion = asString(
      first.direccion || first.direccion_predio || first.dir || ''
    );

    return (
      <div key={idx} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a738cd]/10">
            <FileText className="h-5 w-5 text-[#a738cd]" />
          </div>
          <div>
            {grupo.matricula ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">
                  Matrícula: {grupo.matricula}
                </h3>
                <p className="text-sm text-gray-600">
                  {grupo.transacciones.length} transacción(es)
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">
                  {tipoDocumento}
                </h3>
                <p className="text-sm text-gray-600">
                  {numeroDocumento || 'Sin número'}
                </p>
              </>
            )}
            {direccion && (
              <p className="mt-1 text-xs text-gray-500">{direccion}</p>
            )}
          </div>
        </div>

        {grupo.transacciones.map((trans, tidx) => (
          <div key={tidx} className="space-y-3 border-t border-gray-100 pt-3">
            {grupo.transacciones.length > 1 && (
              <h4 className="text-sm font-semibold text-gray-800">
                Transacción {tidx + 1}
              </h4>
            )}

            <DetailGrid
              title="Información del documento"
              items={[
                ...(trans.tipo_documento
                  ? [['Tipo de documento', asString(trans.tipo_documento)] as [string, string]]
                  : []),
                ...(trans.numero_documento
                  ? [['Número documento', asString(trans.numero_documento)] as [string, string]]
                  : []),
                ...(trans.radicado
                  ? [['Radicado', asString(trans.radicado)] as [string, string]]
                  : []),
                ...(trans.fecha || trans.fecha_documento || trans.fecha_registro
                  ? [
                      [
                        'Fecha',
                        formatDate(
                          asString(
                            trans.fecha ||
                              trans.fecha_documento ||
                              trans.fecha_registro
                          )
                        ),
                      ] as [string, string],
                    ]
                  : []),
              ]}
            />

            {Boolean(
              trans.matricula_inmobiliaria || trans.direccion || trans.chip
            ) && (
              <DetailGrid
                title="Información del inmueble"
                items={[
                  ...(trans.matricula_inmobiliaria
                    ? [
                        [
                          'Matrícula inmobiliaria',
                          asString(trans.matricula_inmobiliaria),
                        ] as [string, string],
                      ]
                    : []),
                  ...(trans.direccion
                    ? [['Dirección', asString(trans.direccion)] as [string, string]]
                    : []),
                  ...(trans.chip
                    ? [['Chip catastral', asString(trans.chip)] as [string, string]]
                    : []),
                ]}
              />
            )}

            {Boolean(trans.cuantia || trans.valor) && (
              <div className="rounded-md border border-purple-100 bg-purple-50/50 px-3 py-3">
                <p className="text-xs text-gray-500">Valor de la transacción</p>
                <p className="text-lg font-semibold text-[#a738cd]">
                  {formatCurrency(asString(trans.cuantia || trans.valor))}
                </p>
              </div>
            )}

            {Boolean(
              trans.comprador || trans.vendedor || trans.intervinientes
            ) && (
              <DetailGrid
                title="Partes involucradas"
                items={[
                  ...(trans.vendedor
                    ? [['Vendedor', asString(trans.vendedor)] as [string, string]]
                    : []),
                  ...(trans.comprador
                    ? [['Comprador', asString(trans.comprador)] as [string, string]]
                    : []),
                  ...(trans.intervinientes
                    ? [
                        [
                          'Intervinientes',
                          asString(trans.intervinientes),
                        ] as [string, string],
                      ]
                    : []),
                ]}
              />
            )}

            <AdditionalFields trans={trans} />
          </div>
        ))}
      </div>
    );
  };

  if (gruposTransacciones.length > 1) {
    return (
      <div className="space-y-3">
        {gruposTransacciones.map((grupo, idx) => {
          const first = grupo.transacciones[0];
          const tipoDoc = asString(first.tipo_documento || first.tipo || 'Transacción');
          const title = grupo.matricula
            ? `Matrícula ${grupo.matricula}`
            : `${tipoDoc} ${idx + 1}`;
          return (
            <Accordion key={idx} title={title} defaultOpen={false}>
              {renderTransactionGroup(grupo, idx)}
            </Accordion>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gruposTransacciones.map(renderTransactionGroup)}
    </div>
  );
}

const CAMPOS_MOSTRADOS = new Set([
  'tipo_documento',
  'numero_documento',
  'radicado',
  'fecha',
  'fecha_documento',
  'fecha_registro',
  'matricula_inmobiliaria',
  'direccion',
  'chip',
  'cuantia',
  'valor',
  'comprador',
  'vendedor',
  'intervinientes',
  'matricula',
  'numeroMatricula',
  'tipoDocumento',
  'numeroDocumento',
  'direccion_predio',
  'dir',
  'tipo',
  'mat_inmobiliaria',
  'valor_transaccion',
]);

function AdditionalFields({ trans }: { trans: DataTransaccion }) {
  const extras = Object.entries(trans).filter(
    ([key, value]) => !CAMPOS_MOSTRADOS.has(key) && value
  );
  if (extras.length === 0) return null;

  return (
    <DetailGrid
      title="Información adicional"
      items={extras.map(
        ([key, value]) =>
          [key.replace(/_/g, ' '), String(value)] as [string, string]
      )}
    />
  );
}

function DetailGrid({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-purple-800">{title}</h4>
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
