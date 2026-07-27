import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROJECT_EMPRESA = 'urbex';
const PROJECT_SLUG = 'multiplaza';

function getApiConfig() {
  const apiKey = process.env.URBEX_API_KEY || process.env.NEXT_PUBLIC_URBEX_API_KEY || '';
  const baseURL =
    process.env.NEXT_PUBLIC_URBEX_API_URL || 'https://api-prod.urbex.com.co';
  return { apiKey, baseURL };
}

async function userHasProjectAccess(
  email: string,
  apiKey: string,
  baseURL: string
): Promise<boolean> {
  try {
    const res = await fetch(`${baseURL}/proyectos/listar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as {
      success?: boolean;
      grupo?: string;
      data?: Array<{ empresa?: string; slug?: string }>;
    };

    if (!data.success) return false;
    if (data.grupo?.includes('@urbex')) return true;

    return (data.data ?? []).some(
      (p) => p.empresa === PROJECT_EMPRESA && p.slug === PROJECT_SLUG
    );
  } catch {
    return false;
  }
}

/**
 * Proxy server-side hacia urbex-api-prod /placaMultiplaza.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const userEmail = typeof body.email === 'string' ? body.email.trim() : '';

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'email es requerido' },
        { status: 400 }
      );
    }

    const { apiKey, baseURL } = getApiConfig();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'URBEX_API_KEY no configurada en el servidor' },
        { status: 500 }
      );
    }

    const allowed = await userHasProjectAccess(userEmail, apiKey, baseURL);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para usar este proyecto' },
        { status: 403 }
      );
    }

    const { email: _email, ...filters } = body;
    void _email;

    const upstream = await fetch(`${baseURL}/placaMultiplaza`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(filters),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de proxy';
    console.error('[api/multiplaza/perfilamiento] proxy error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
