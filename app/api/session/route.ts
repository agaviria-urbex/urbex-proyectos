import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/get-client-ip';
import {
  registerSession,
  invalidateSession,
  invalidateUserSessions,
} from '@/lib/session-manager';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/session
 * Registra una nueva sesión para un usuario
 * 
 * Body: { userId: string, email: string, deviceId: string }
 * Returns: { success, sessionId, ipAddress, deviceId, invalidatedSessions, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, deviceId } = body;

    // Validar campos requeridos
    if (!userId || !email || !deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: userId, email, deviceId',
        },
        { status: 400 }
      );
    }

    // Obtener IP del cliente
    const ipAddress = getClientIP(request);

    // Registrar sesión (esto invalidará automáticamente sesiones con deviceId diferente)
    const { sessionId, invalidatedSessions } = registerSession(
      userId,
      email,
      ipAddress,
      deviceId
    );

    return NextResponse.json(
      {
        success: true,
        sessionId,
        ipAddress,
        deviceId,
        invalidatedSessions,
        message: 'Sesión registrada exitosamente',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error registrando sesión:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al registrar sesión',
        message: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/session
 * Invalida una sesión específica o todas las sesiones de un usuario
 * 
 * Headers: x-session-id (opcional), x-user-id (opcional)
 * - Si se proporciona x-session-id: invalida esa sesión
 * - Si se proporciona x-user-id: invalida todas las sesiones del usuario
 * - Si se proporcionan ambos: invalida la sesión específica
 * Returns: { success, message }
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');
    const userId = request.headers.get('x-user-id');

    // Si no se proporciona ni sessionId ni userId, error
    if (!sessionId && !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere x-session-id o x-user-id header',
        },
        { status: 400 }
      );
    }

    let message = '';
    let success = false;

    // Si se proporciona sessionId, invalidar esa sesión
    if (sessionId) {
      success = invalidateSession(sessionId);
      message = success
        ? `Sesión ${sessionId} invalidada exitosamente`
        : `Sesión ${sessionId} no encontrada`;
    }

    // Si se proporciona userId, invalidar todas las sesiones del usuario
    if (userId) {
      const count = invalidateUserSessions(userId);
      success = count > 0;
      message = count > 0
        ? `${count} sesión(es) invalidada(s) para usuario ${userId}`
        : `No se encontraron sesiones para usuario ${userId}`;
    }

    return NextResponse.json(
      {
        success,
        message,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error invalidando sesión:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al invalidar sesión',
        message: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

