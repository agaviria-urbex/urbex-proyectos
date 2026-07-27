'use client';

import type { DataInformacion } from '../types';
import { Badge } from '@/components/ui/badge';
import { Mail, MapPin, Phone, User } from 'lucide-react';

interface ContactInfoProps {
  data: DataInformacion[];
}

function formatDate(dateString: string) {
  if (!dateString || dateString === 'NO REGISTRA') return dateString;
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

function splitPipe(value: string) {
  if (!value) return [];
  return value
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ContactInfo({ data }: ContactInfoProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">No se encontró información de contacto</p>;
  }

  const contact = data[0];
  const phones = splitPipe(contact.telefonos);
  const addresses = splitPipe(contact.contacto_direccion);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a738cd]/10">
          <User className="h-5 w-5 text-[#a738cd]" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Nombre completo
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {contact.nombre || 'No registra'}
          </p>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-purple-800">Identificación</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoItem label="Tipo de documento" value={contact.tipo || 'N/A'} />
          <InfoItem label="Número" value={contact.identificacion || 'N/A'} />
          {contact.edad !== undefined && contact.edad !== null && (
            <InfoItem label="Edad" value={`${contact.edad} años`} />
          )}
          <InfoItem
            label="Tipo de propietario"
            value={contact.tipoPropietario || 'N/A'}
          />
          <InfoItem
            label="Fecha documento"
            value={formatDate(contact.fechaDocumento)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-purple-800">Datos de contacto</h3>
        <div className="flex items-start gap-2">
          <Mail className="mt-0.5 h-4 w-4 text-[#a738cd]" />
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm text-gray-900">{contact.email || 'No registra'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Phone className="mt-0.5 h-4 w-4 text-[#a738cd]" />
          <div>
            <p className="mb-1 text-xs text-gray-500">Teléfonos</p>
            <div className="flex flex-wrap gap-2">
              {phones.length > 0 ? (
                phones.map((phone) => (
                  <Badge key={phone} variant="secondary" className="font-normal">
                    {phone}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-900">No registra</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-[#a738cd]" />
          <div>
            <p className="mb-1 text-xs text-gray-500">Direcciones</p>
            {addresses.length > 0 ? (
              <ul className="space-y-1">
                {addresses.map((address) => (
                  <li key={address} className="text-sm text-gray-900">
                    {address}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-900">No registra</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-purple-800">Ubicación</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoItem label="Ciudad" value={contact.contacto_ciudad || 'N/A'} />
          <InfoItem label="Departamento" value={contact.contacto_dpto || 'N/A'} />
          <InfoItem
            label="Código municipio"
            value={contact.contacto_mpioccdgo || 'N/A'}
          />
          <InfoItem
            label="Código departamento"
            value={contact.contacto_dptoccdgo || 'N/A'}
          />
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
