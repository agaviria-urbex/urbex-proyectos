'use client';

import type { DataApiVehiculo, DataId2Vehiculo, DataVehiculo } from '../types';
import { Accordion } from './Accordion';
import { Badge } from '@/components/ui/badge';
import { Car } from 'lucide-react';

interface VehicleInfoProps {
  data_vehiculos: DataVehiculo[] | string;
  data_api_vehiculo: DataApiVehiculo[] | string;
  data_id_2_vehiculo: DataId2Vehiculo[] | string;
}

type CombinedVehicle = {
  tipo: 'vehiculos' | 'api_vehiculo' | 'id_2_vehiculo';
  data: DataVehiculo | DataApiVehiculo | DataId2Vehiculo;
  vehicles?: DataVehiculo[];
};

function isEmptyData(data: unknown[] | string): boolean {
  if (typeof data === 'string') return true;
  return !data || data.length === 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
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

export function VehicleInfo({
  data_vehiculos,
  data_api_vehiculo,
  data_id_2_vehiculo,
}: VehicleInfoProps) {
  const hasDataVehiculos = !isEmptyData(data_vehiculos);
  const hasDataApiVehiculo = !isEmptyData(data_api_vehiculo);
  const hasDataId2Vehiculo = !isEmptyData(data_id_2_vehiculo);

  if (!hasDataVehiculos && !hasDataApiVehiculo && !hasDataId2Vehiculo) {
    return (
      <p className="text-sm text-gray-500">
        No se encontraron vehículos asociados a la consulta
      </p>
    );
  }

  const placasUsadas = new Set<string>();
  const vehiculosCombinados: CombinedVehicle[] = [];

  if (hasDataVehiculos) {
    const vehiculos = data_vehiculos as DataVehiculo[];
    const vehiclesByPlate: Record<string, DataVehiculo[]> = {};
    vehiculos.forEach((v) => {
      if (!vehiclesByPlate[v.placa]) vehiclesByPlate[v.placa] = [];
      vehiclesByPlate[v.placa].push(v);
    });
    Object.entries(vehiclesByPlate).forEach(([placa, vehicles]) => {
      placasUsadas.add(placa);
      vehiculosCombinados.push({
        tipo: 'vehiculos',
        data: vehicles[0],
        vehicles,
      });
    });
  }

  if (hasDataApiVehiculo) {
    (data_api_vehiculo as DataApiVehiculo[]).forEach((v) => {
      if (!placasUsadas.has(v.placa)) {
        placasUsadas.add(v.placa);
        vehiculosCombinados.push({ tipo: 'api_vehiculo', data: v });
      }
    });
  }

  if (hasDataId2Vehiculo) {
    (data_id_2_vehiculo as DataId2Vehiculo[]).forEach((v) => {
      if (!placasUsadas.has(v.placa)) {
        placasUsadas.add(v.placa);
        vehiculosCombinados.push({ tipo: 'id_2_vehiculo', data: v });
      }
    });
  }

  if (vehiculosCombinados.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No se encontraron vehículos asociados a la consulta
      </p>
    );
  }

  const content = (item: CombinedVehicle, idx: number) => {
    if (item.tipo === 'vehiculos') {
      const vehicleData = item.data as DataVehiculo;
      const allVehicles = item.vehicles!;
      return (
        <div key={idx} className="space-y-4">
          <VehicleHeader
            placa={vehicleData.placa}
            description={`${vehicleData.marca} ${vehicleData.linea} ${vehicleData.modelo}`}
            badge={vehicleData.tipoServicio}
          />
          <DetailGrid
            title="Información del vehículo"
            items={[
              ['Marca', vehicleData.marca],
              ['Línea', vehicleData.linea],
              ['Modelo', String(vehicleData.modelo)],
              ['Carrocería', vehicleData.carroceria],
              ['Capacidad', `${vehicleData.capacidadCarga} pasajeros`],
              ['Tipo de servicio', vehicleData.tipoServicio],
            ]}
          />
          <DetailGrid
            title="Información del propietario"
            items={[
              ['Nombre', vehicleData.nombre],
              ['Identificación', `${vehicleData.tipoID} ${vehicleData.numID}`],
              ['Responsable', vehicleData.responsable],
              ['% Responsabilidad', `${vehicleData.porcentajeRespon}%`],
              ['Fecha desde', formatDate(vehicleData.fechaDesde)],
            ]}
          />
          {allVehicles.length > 1 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-purple-800">
                Historial de avalúos
              </h4>
              <div className="space-y-2">
                {[...allVehicles]
                  .sort((a, b) => b.anio - a.anio)
                  .map((v) => (
                    <div
                      key={`${v.placa}-${v.anio}`}
                      className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <span className="font-semibold text-[#a738cd]">{v.anio}</span>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(v.avaluo)}</p>
                        <p className="text-xs text-gray-500">Tarifa: {v.tarifa}%</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (item.tipo === 'api_vehiculo') {
      const vehicle = item.data as DataApiVehiculo;
      return (
        <div key={idx} className="space-y-4">
          <VehicleHeader
            placa={vehicle.placa}
            description={`${vehicle.marca} ${vehicle.linea} ${vehicle.modelo}`}
            badge={vehicle.tipoServicio}
          />
          <DetailGrid
            title="Información del vehículo"
            items={[
              ['Marca', vehicle.marca],
              ['Línea', vehicle.linea],
              ['Modelo', String(vehicle.modelo)],
              ['Carrocería', vehicle.carroceria || 'N/A'],
              ['Capacidad de carga', String(vehicle.capacidadCarga)],
              ['Clase', vehicle.clase || 'N/A'],
            ]}
          />
          <DetailGrid
            title="Información del propietario"
            items={[
              ['Identificación', vehicle.identificacion],
              ['Responsable', vehicle.responsable],
              ['% Responsabilidad', `${vehicle.porcentajeRespon}%`],
              ['Tipo de servicio', vehicle.tipoServicio],
            ]}
          />
        </div>
      );
    }

    const vehicle = item.data as DataId2Vehiculo;
    return (
      <div key={idx} className="space-y-4">
        <VehicleHeader
          placa={vehicle.placa}
          description={`${vehicle.marca} ${vehicle.linea} ${vehicle.modelo}`}
          badge={vehicle.tipoServicio}
        />
        <DetailGrid
          title="Información del vehículo"
          items={[
            ['Marca', vehicle.marca],
            ['Línea', vehicle.linea],
            ['Modelo', String(vehicle.modelo)],
            ['Carrocería', vehicle.carroceria || 'N/A'],
            ['Capacidad de carga', String(vehicle.capacidadCarga)],
            ['Clase', vehicle.clase || 'N/A'],
          ]}
        />
        <DetailGrid
          title="Información adicional"
          items={[
            ['Identificación', vehicle.identificacion],
            ['Responsable', vehicle.responsable],
            ['% Responsabilidad', `${vehicle.porcentajeRespon}%`],
            ['Tipo de servicio', vehicle.tipoServicio],
            ['Fecha consulta', formatDate(vehicle.fecha_consulta)],
            ['Fecha actualización', formatDate(vehicle.fecha_actualizacion)],
          ]}
        />
      </div>
    );
  };

  if (vehiculosCombinados.length > 1) {
    return (
      <div className="space-y-3">
        {vehiculosCombinados.map((item, idx) => {
          const vehicleData = item.data as { placa: string; marca: string; linea: string };
          return (
            <Accordion
              key={`${vehicleData.placa}-${idx}`}
              title={`${vehicleData.placa} - ${vehicleData.marca} ${vehicleData.linea}`}
              defaultOpen={false}
            >
              {content(item, idx)}
            </Accordion>
          );
        })}
      </div>
    );
  }

  return <div className="space-y-3">{vehiculosCombinados.map(content)}</div>;
}

function VehicleHeader({
  placa,
  description,
  badge,
}: {
  placa: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a738cd]/10">
        <Car className="h-5 w-5 text-[#a738cd]" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{placa}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        {badge && (
          <Badge className="mt-2 bg-[#a738cd] hover:bg-[#a738cd] text-white">
            {badge}
          </Badge>
        )}
      </div>
    </div>
  );
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
