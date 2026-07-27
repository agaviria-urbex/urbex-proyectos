import type { ApiFilters, ApiResponse, IsochroneData, IsochroneFilters } from '../types';

const CACHE_EXPIRATION_TIME = 30 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function generatePerfilamientoCacheKey(filters: ApiFilters): string {
  const sortedFilters = JSON.stringify(filters, Object.keys(filters).sort());
  return `placaMultiplaza_${sortedFilters}`;
}

function generateIsochroneCacheKey(filters: IsochroneFilters): string {
  const sortedFilters = JSON.stringify(filters, Object.keys(filters).sort());
  return `isocronasMultiplaza_${sortedFilters}`;
}

function isCacheExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() - entry.timestamp > CACHE_EXPIRATION_TIME;
}

export function getCachedData(filters: ApiFilters): ApiResponse | null {
  const key = generatePerfilamientoCacheKey(filters);
  const entry = cache.get(key);
  if (!entry) return null;
  if (isCacheExpired(entry)) {
    cache.delete(key);
    return null;
  }
  return entry.data as ApiResponse;
}

export function setCachedData(filters: ApiFilters, data: ApiResponse): void {
  const key = generatePerfilamientoCacheKey(filters);
  cache.set(key, { data, timestamp: Date.now() });
}

export function getCachedIsochroneData(
  filters: IsochroneFilters
): IsochroneData | null {
  const key = generateIsochroneCacheKey(filters);
  const entry = cache.get(key);
  if (!entry) return null;
  if (isCacheExpired(entry)) {
    cache.delete(key);
    return null;
  }
  return entry.data as IsochroneData;
}

export function setCachedIsochroneData(
  filters: IsochroneFilters,
  data: IsochroneData
): void {
  const key = generateIsochroneCacheKey(filters);
  cache.set(key, { data, timestamp: Date.now() });
}
