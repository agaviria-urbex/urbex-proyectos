/**
 * Utilidad para obtener la IP real del cliente
 * Considera headers de proxies y balanceadores de carga
 */

import { NextRequest } from 'next/server';

/**
 * Obtiene la IP del cliente desde la request
 * Considera headers comunes de proxies y balanceadores de carga:
 * - x-forwarded-for: IPs en cadena (puede tener múltiples)
 * - x-real-ip: IP real del cliente
 * - cf-connecting-ip: IP cuando se usa Cloudflare
 * 
 * @param request - NextRequest de Next.js
 * @returns IP del cliente o 'unknown' si no se puede determinar
 */
export function getClientIP(request: NextRequest): string {
  // Intentar obtener IP de diferentes headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  // Prioridad: Cloudflare > x-real-ip > x-forwarded-for
  if (cfConnectingIP) {
    // Cloudflare siempre proporciona la IP real
    return cfConnectingIP.trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (forwardedFor) {
    // x-forwarded-for puede contener múltiples IPs separadas por coma
    // La primera IP es generalmente la IP original del cliente
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || 'unknown';
  }
  
  // Si no hay headers, intentar obtener de la conexión (poco probable en Next.js)
  // En Next.js, esto generalmente no está disponible directamente
  // Por lo tanto, retornamos 'unknown' como fallback
  return 'unknown';
}

