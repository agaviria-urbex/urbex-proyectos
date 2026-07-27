import { NextRequest, NextResponse } from 'next/server';
import { loadKiaJson, userHasKiaAccess } from '@/lib/kia-data';
import type { KiaLeadsPayload } from '@/projects/urbex/kia/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'email es requerido' },
        { status: 400 }
      );
    }

    const allowed = await userHasKiaAccess(email);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para usar este proyecto' },
        { status: 403 }
      );
    }

    const data = loadKiaJson<KiaLeadsPayload>('leads.json');
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de proxy';
    console.error('[api/kia/leads]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
