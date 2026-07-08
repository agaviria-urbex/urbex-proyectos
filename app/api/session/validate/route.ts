import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/get-client-ip';
import {
  validateSession,
  getSession,
  recoverSession,
} from '@/lib/session-manager';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/session/validate
 * Valida una sesión existente
 * Si la sesión no existe pero el usuario está autenticado, intenta recuperarla automáticamente
 * 
 * Headers: 
 *   - x-session-id (requerido)
 *   - x-user-id (opcional, requerido para recuperación)
 *   - x-device-id (opcional, requerido para recuperación)
 *   - x-user-email (opcional, requerido para recuperación)
 * Returns: { valid, userId, email, ipAddress, deviceId, sessionId, recovered? }
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');
    const userId = request.headers.get('x-user-id') || undefined;
    const deviceId = request.headers.get('x-device-id') || undefined;
    const userEmail = request.headers.get('x-user-email') || undefined;

    // Validar que se proporcionó sessionId
    if (!sessionId) {
      return NextResponse.json(
        {
          valid: false,
          error: 'x-session-id header es requerido',
        },
        { status: 400 }
      );
    }

    // Obtener IP del cliente
    const ipAddress = getClientIP(request);

    console.log(`🔍 Validando sesión: ${sessionId}, userId: ${userId}, deviceId: ${deviceId}, IP: ${ipAddress}`);

    // Validar sesión
    let isValid = validateSession(sessionId, userId, ipAddress, deviceId);
    let recovered = false;
    let currentSessionId = sessionId;

    // Si la sesión no es válida pero tenemos userId, deviceId y email, intentar recuperar
    if (!isValid && userId && deviceId && userEmail) {
      console.log(`⚠️ Sesión ${sessionId} no encontrada o inválida, pero usuario está autenticado. Intentando recuperar sesión...`);
      
      try {
        const recoveredSessionId = recoverSession(userId, userEmail, ipAddress, deviceId);
        recovered = true;
        currentSessionId = recoveredSessionId;
        
        // Validar la sesión recuperada
        isValid = validateSession(recoveredSessionId, userId, ipAddress, deviceId);
        
        if (isValid) {
          console.log(`✅ Sesión recuperada exitosamente: ${recoveredSessionId}`);
        } else {
          console.log(`❌ Sesión recuperada pero aún inválida: ${recoveredSessionId}`);
        }
      } catch (recoveryError: any) {
        console.error(`❌ Error al recuperar sesión:`, recoveryError);
        // Continuar con el flujo normal de error
      }
    }

    if (!isValid) {
      return NextResponse.json(
        {
          valid: false,
          sessionId: currentSessionId,
          message: recovered 
            ? 'Sesión recuperada pero aún inválida' 
            : 'Sesión inválida o expirada',
          recovered,
        },
        { status: 200 } // 200 porque la validación fue exitosa, solo que el resultado es false
      );
    }

    // Obtener información de la sesión (puede ser la original o la recuperada)
    const session = getSession(currentSessionId);
    if (!session) {
      return NextResponse.json(
        {
          valid: false,
          sessionId: currentSessionId,
          message: 'Sesión no encontrada después de recuperación',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        userId: session.userId,
        email: session.email,
        ipAddress: session.ipAddress,
        deviceId: session.deviceId,
        sessionId: session.sessionId,
        recovered, // Indicar si la sesión fue recuperada
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error validando sesión:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Error al validar sesión',
        message: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

