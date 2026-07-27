import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROJECT_EMPRESA = 'urbex';
const PROJECT_SLUG = 'leads-generation';

type SearchBody = {
  email?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  codVerificacion?: string;
  telefono?: string;
  searchEmail?: string;
  placa?: string;
};

function getApiConfig() {
  const apiKey = process.env.URBEX_API_KEY || process.env.NEXT_PUBLIC_URBEX_API_KEY || '';
  const baseURL =
    process.env.NEXT_PUBLIC_URBEX_API_URL || 'https://api-prod.urbex.com.co';
  return { apiKey, baseURL };
}

function validatePayload(body: SearchBody): { ok: true; payload: Record<string, string> } | { ok: false; error: string } {
  const hasDoc = Boolean(body.tipoDocumento && body.numeroDocumento?.trim());
  const hasPhone = Boolean(body.telefono?.trim());
  const hasEmail = Boolean(body.searchEmail?.trim());
  const hasPlate = Boolean(body.placa?.trim());

  const modes = [hasDoc, hasPhone, hasEmail, hasPlate].filter(Boolean).length;
  if (modes !== 1) {
    return {
      ok: false,
      error: 'Debe enviar exactamente un criterio: documento, teléfono, email o placa',
    };
  }

  if (hasDoc) {
    const tipoDocumento = String(body.tipoDocumento).toUpperCase();
    const numeroDocumento = String(body.numeroDocumento).trim();
    const payload: Record<string, string> = { tipoDocumento, numeroDocumento };
    if (tipoDocumento === 'NIT') {
      const cod = body.codVerificacion?.trim();
      if (!cod || !/^\d$/.test(cod)) {
        return { ok: false, error: 'El código de verificación es requerido para NIT (1 dígito)' };
      }
      payload.codVerificacion = cod;
    }
    return { ok: true, payload };
  }

  if (hasPhone) {
    const telefono = String(body.telefono).replace(/\D/g, '');
    if (telefono.length < 7) {
      return { ok: false, error: 'El teléfono debe tener al menos 7 dígitos' };
    }
    return { ok: true, payload: { telefono } };
  }

  if (hasEmail) {
    const email = String(body.searchEmail).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'El email no es válido' };
    }
    return { ok: true, payload: { email } };
  }

  const placa = String(body.placa).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (placa.length !== 6) {
    return { ok: false, error: 'La placa debe tener exactamente 6 caracteres' };
  }
  return { ok: true, payload: { placa } };
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
 * Proxy server-side hacia urbex-api-prod /LeadsByID.
 * Usa URBEX_API_KEY sin exponerla en el browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchBody;
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

    const validated = validatePayload(body);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${baseURL}/LeadsByID`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(validated.payload),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de proxy';
    console.error('[api/leads/search] proxy error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
