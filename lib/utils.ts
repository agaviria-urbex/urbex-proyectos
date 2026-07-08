import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyCOP(
  value: number | string | null | undefined,
  fallback = ''
): string {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  if (!isFinite(num) || isNaN(num)) return fallback;
  const rounded = Math.round(num);
  return `$${rounded.toLocaleString('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
}
