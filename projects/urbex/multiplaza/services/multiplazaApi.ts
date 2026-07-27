import type { ApiFilters, ApiResponse, IsochroneData, IsochroneFilters } from '../types';
import {
  getCachedData,
  setCachedData,
  getCachedIsochroneData,
  setCachedIsochroneData,
} from './cache';

export async function fetchPerfilamientoData(
  email: string,
  filters: ApiFilters
): Promise<ApiResponse> {
  const cachedData = getCachedData(filters);
  if (cachedData) return cachedData;

  const response = await fetch('/api/multiplaza/perfilamiento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, ...filters }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : `Error en la API: ${response.status}`;
    throw new Error(message);
  }

  if (data?.success === false && data?.error) {
    throw new Error(String(data.error));
  }

  setCachedData(filters, data as ApiResponse);
  return data as ApiResponse;
}

export async function fetchIsochroneData(
  email: string,
  filters: IsochroneFilters
): Promise<IsochroneData> {
  const cachedData = getCachedIsochroneData(filters);
  if (cachedData) return cachedData;

  const response = await fetch('/api/multiplaza/isocronas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, isocrona: filters.isocrona }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : `Error en la API: ${response.status}`;
    throw new Error(message);
  }

  if (data?.success === false && data?.error) {
    throw new Error(String(data.error));
  }

  setCachedIsochroneData(filters, data as IsochroneData);
  return data as IsochroneData;
}
