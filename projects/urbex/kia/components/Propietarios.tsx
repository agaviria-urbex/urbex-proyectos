'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import type { KiaLead, KiaOwnerGroup } from '../types';
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

interface PropietariosProps {
  userEmail: string;
}

function buildOwnerGroups(leads: KiaLead[]): KiaOwnerGroup[] {
  const map: Record<string, KiaOwnerGroup> = {};
  leads.forEach((r) => {
    const key = r.ownerId || r.ownerName || r.plate;
    if (!map[key]) {
      map[key] = {
        ownerId: r.ownerId,
        ownerName: r.ownerName,
        ownerType: r.ownerType,
        contactStatus: r.contactStatus,
        emailPrimary: r.emailPrimary,
        phonePrimary: r.phonePrimary,
        city: r.city,
        vehicles: [],
        vehicleCount: 0,
      };
    }
    map[key].vehicles.push({
      plate: r.plate,
      model: r.modelGroup,
      year: r.manufactureYear,
      service: r.serviceTag,
    });
  });

  return Object.values(map)
    .map((g) => ({ ...g, vehicleCount: g.vehicles.length }))
    .sort((a, b) => b.vehicleCount - a.vehicleCount);
}

export function Propietarios({ userEmail }: PropietariosProps) {
  const [owners, setOwners] = useState<KiaOwnerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ownerType, setOwnerType] = useState('all');
  const [contact, setContact] = useState('all');
  const [minVehicles, setMinVehicles] = useState('1');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKiaLeads(userEmail);
        if (cancelled) return;
        setOwners(buildOwnerGroups(data.leads || []));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Error cargando propietarios'
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const min = parseInt(minVehicles, 10) || 1;
    return owners.filter((g) => {
      if (q && !g.ownerName?.toLowerCase().includes(q)) return false;
      if (ownerType !== 'all' && g.ownerType !== ownerType) return false;
      if (contact !== 'all' && g.contactStatus !== contact) return false;
      if (g.vehicleCount < min) return false;
      return true;
    });
  }, [owners, search, ownerType, contact, minVehicles]);

  const maxOwner = owners[0];
  const multi = owners.filter((g) => g.vehicleCount >= 2).length;

  const exportCSV = () => {
    const header = [
      'Owner',
      'Owner Type',
      'Vehicles',
      'Models',
      'Contact Status',
      'Email',
      'Phone',
      'City',
    ].join(',');
    const rows = filtered.map((g) => {
      const models = Object.entries(
        g.vehicles.reduce<Record<string, number>>((acc, v) => {
          acc[v.model] = (acc[v.model] || 0) + 1;
          return acc;
        }, {})
      )
        .map(([m, c]) => `${m}${c > 1 ? ` x${c}` : ''}`)
        .join('; ');
      return [
        g.ownerName,
        g.ownerType,
        g.vehicleCount,
        models,
        g.contactStatus,
        g.emailPrimary || '',
        g.phonePrimary || '',
        g.city || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });
    const blob = new Blob(['\uFEFF' + [header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kia_owners_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <h2 className="text-2xl font-bold text-gray-900">Propietarios</h2>
          <p className="text-sm text-gray-600">
            Agrupación de leads por propietario y análisis multi-vehículo
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-gray-500">Propietarios únicos</p>
            <p className="mt-2 text-3xl font-bold">
              {owners.length.toLocaleString('es-CO')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-gray-500">Multi-vehículo</p>
            <p className="mt-2 text-3xl font-bold">
              {multi.toLocaleString('es-CO')}
            </p>
            <p className="text-xs text-gray-500">con 2 o más placas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-gray-500">Máximo por owner</p>
            <p className="mt-2 text-3xl font-bold text-[#a738cd]">
              {maxOwner?.vehicleCount ?? 0}
            </p>
            <p className="text-xs text-gray-500">
              {maxOwner?.ownerName?.split(' ').slice(0, 3).join(' ') || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              {filtered.length === owners.length
                ? `${filtered.length.toLocaleString('es-CO')} owners`
                : `${filtered.length.toLocaleString('es-CO')} de ${owners.length.toLocaleString('es-CO')} owners`}
            </CardTitle>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8"
                placeholder="Buscar propietario…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={ownerType} onValueChange={setOwnerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Company">Empresa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contact} onValueChange={setContact}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los contactos</SelectItem>
                <SelectItem value="Email + Phone">Email + Tel.</SelectItem>
                <SelectItem value="Email only">Solo Email</SelectItem>
                <SelectItem value="Phone only">Solo Tel.</SelectItem>
                <SelectItem value="No contact">Sin contacto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={minVehicles} onValueChange={setMinVehicles}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Mín. 1 vehículo</SelectItem>
                <SelectItem value="2">Mín. 2 vehículos</SelectItem>
                <SelectItem value="3">Mín. 3 vehículos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  'Propietario',
                  'Tipo',
                  'Vehículos',
                  'Modelos',
                  'Contacto',
                  'Email',
                  'Teléfono',
                  'Ciudad',
                ].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-gray-500">
                    No hay propietarios con los filtros actuales
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const modelTally: Record<string, number> = {};
                  g.vehicles.forEach((v) => {
                    modelTally[v.model] = (modelTally[v.model] || 0) + 1;
                  });
                  return (
                    <tr
                      key={`${g.ownerId || g.ownerName}-${g.vehicleCount}`}
                      className="border-b"
                    >
                      <td className="px-3 py-2 font-medium">
                        {g.ownerName || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary">{g.ownerType}</Badge>
                      </td>
                      <td
                        className={`px-3 py-2 text-lg font-bold ${
                          g.vehicleCount > 1 ? 'text-[#a738cd]' : 'text-gray-700'
                        }`}
                      >
                        {g.vehicleCount}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(modelTally).map(([m, c]) => (
                            <Badge key={m} variant="outline" className="font-normal">
                              {m}
                              {c > 1 ? ` ×${c}` : ''}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">{g.contactStatus}</td>
                      <td className="px-3 py-2 text-xs">{g.emailPrimary || '—'}</td>
                      <td className="px-3 py-2">{g.phonePrimary || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{g.city || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
