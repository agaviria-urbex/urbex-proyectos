'use client';

import type { LeadsApiResponse } from '../types';
import { Accordion } from './Accordion';
import { ContactInfo } from './ContactInfo';
import { VehicleInfo } from './VehicleInfo';
import { PropertyInfo } from './PropertyInfo';
import { TransactionInfo } from './TransactionInfo';
import { SearchX } from 'lucide-react';

interface ResultsDisplayProps {
  results: LeadsApiResponse;
}

function isEmptyData(data: unknown[] | string | undefined): boolean {
  if (typeof data === 'string') return true;
  return !data || data.length === 0;
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const hasContactInfo =
    results.data_informacion && results.data_informacion.length > 0;
  const hasVehicleInfo =
    !isEmptyData(results.data_vehiculos) ||
    !isEmptyData(results.data_api_vehiculo) ||
    !isEmptyData(results.data_id_2_vehiculo);
  const hasPropertyInfo = !isEmptyData(results.data_prediales);
  const hasTransactionInfo = !isEmptyData(results.data_transacciones);

  const getVehicleCount = (): number => {
    const placasUnicas = new Set<string>();
    if (!isEmptyData(results.data_vehiculos)) {
      (results.data_vehiculos as { placa?: string }[]).forEach((v) => {
        if (v.placa) placasUnicas.add(v.placa);
      });
    }
    if (!isEmptyData(results.data_api_vehiculo)) {
      (results.data_api_vehiculo as { placa?: string }[]).forEach((v) => {
        if (v.placa) placasUnicas.add(v.placa);
      });
    }
    if (!isEmptyData(results.data_id_2_vehiculo)) {
      (results.data_id_2_vehiculo as { placa?: string }[]).forEach((v) => {
        if (v.placa) placasUnicas.add(v.placa);
      });
    }
    return placasUnicas.size;
  };

  if (
    !hasContactInfo &&
    !hasVehicleInfo &&
    !hasPropertyInfo &&
    !hasTransactionInfo
  ) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
        <SearchX className="mx-auto mb-3 h-10 w-10 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">
          No se encontraron resultados
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No hay información disponible para los criterios de búsqueda ingresados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Resultados de la búsqueda</h2>
        {results.meta?.timestamp && (
          <p className="text-sm text-gray-500">
            Búsqueda realizada el{' '}
            {new Date(results.meta.timestamp).toLocaleString('es-CO')}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {hasContactInfo && (
          <Accordion
            title="Información de contacto"
            defaultOpen
            badge={results.data_informacion.length}
          >
            <ContactInfo data={results.data_informacion} />
          </Accordion>
        )}

        {hasVehicleInfo && (
          <Accordion
            title="Información de vehículo(s)"
            defaultOpen={false}
            badge={getVehicleCount()}
          >
            <VehicleInfo
              data_vehiculos={results.data_vehiculos}
              data_api_vehiculo={results.data_api_vehiculo}
              data_id_2_vehiculo={results.data_id_2_vehiculo}
            />
          </Accordion>
        )}

        {hasPropertyInfo && (
          <Accordion
            title="Predios asociados"
            defaultOpen={false}
            badge={(results.data_prediales as unknown[]).length}
          >
            <PropertyInfo data={results.data_prediales} />
          </Accordion>
        )}

        {hasTransactionInfo && (
          <Accordion
            title="Transacciones"
            defaultOpen={false}
            badge={(results.data_transacciones as unknown[]).length}
          >
            <TransactionInfo data={results.data_transacciones} />
          </Accordion>
        )}
      </div>
    </div>
  );
}
