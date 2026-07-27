import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ENDPOINTS = new Set([
  '/proyectos/listar',
  '/proyectos/detalle',
  '/proyectos/editar',
  '/proyectos/grupos/listar',
  '/proyectos/grupos/asignar',
  '/proyectos/grupos/eliminar',
]);

/**
 * Proxy server-side hacia urbex-api-prod.
 * Usa URBEX_API_KEY (sin NEXT_PUBLIC_) para no exponer la key en el browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, ...payload } = body as {
      endpoint?: string;
      [key: string]: unknown;
    };

    if (!endpoint || typeof endpoint !== 'string' || !ALLOWED_ENDPOINTS.has(endpoint)) {
      return NextResponse.json(
        { success: false, error: 'Endpoint no permitido' },
        { status: 400 }
      );
    }

    const apiKey = process.env.URBEX_API_KEY || process.env.NEXT_PUBLIC_URBEX_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'URBEX_API_KEY no configurada en el servidor' },
        { status: 500 }
      );
    }

    const baseURL =
      process.env.NEXT_PUBLIC_URBEX_API_URL || 'https://api-prod.urbex.com.co';

    const upstream = await fetch(`${baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de proxy';
    console.error('[api/proyectos] proxy error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
