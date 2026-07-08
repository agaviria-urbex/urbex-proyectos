/**
 * Gestor de sesiones en memoria
 * Previene sesiones simultáneas desde diferentes dispositivos
 * Permite que el mismo dispositivo mantenga sesión aunque cambie la IP
 * 
 * Usa globalThis para persistir entre recargas de módulos (hot reload)
 */

export interface UserSession {
  userId: string;
  email: string;
  ipAddress: string;
  deviceId: string;
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  isValid: boolean;
}

// Usar globalThis para persistir entre recargas de módulos (hot reload)
// Esto evita que se pierdan las sesiones cuando Next.js recompila
const globalForSessions = globalThis as unknown as {
  sessions: Map<string, UserSession> | undefined;
  userSessions: Map<string, Set<string>> | undefined;
  cleanupInterval: NodeJS.Timeout | undefined;
};

// Inicializar o reutilizar Maps existentes
const sessions = globalForSessions.sessions ?? new Map<string, UserSession>();
const userSessions = globalForSessions.userSessions ?? new Map<string, Set<string>>();

// Guardar en globalThis para persistir entre recargas
if (!globalForSessions.sessions) {
  globalForSessions.sessions = sessions;
  globalForSessions.userSessions = userSessions;
  console.log('🔄 Inicializado almacenamiento de sesiones en globalThis (persistirá entre recargas)');
} else {
  console.log(`🔄 Reutilizando sesiones existentes: ${sessions.size} sesiones, ${userSessions.size} usuarios`);
}

// Tiempo de expiración de sesión (24 horas en milisegundos)
const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

// Intervalo de limpieza automática (5 minutos en milisegundos)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Genera un sessionId único
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Limpia sesiones expiradas automáticamente
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  const expiredSessions: string[] = [];

  sessions.forEach((session, sessionId) => {
    // Solo limpiar sesiones que están marcadas como válidas pero expiradas
    if (session.isValid) {
      const timeSinceLastActivity = now - session.lastActivity.getTime();
      if (timeSinceLastActivity > SESSION_EXPIRATION_MS) {
        expiredSessions.push(sessionId);
        console.log(`⏰ Sesión ${sessionId} expirada (${Math.round(timeSinceLastActivity / 1000 / 60)} minutos de inactividad)`);
      }
    }
  });

  expiredSessions.forEach(sessionId => {
    invalidateSession(sessionId);
  });

  if (expiredSessions.length > 0) {
    console.log(`🧹 Limpieza automática: ${expiredSessions.length} sesiones expiradas marcadas como inválidas`);
  }
}

// Iniciar limpieza automática cada 5 minutos
// Solo en entorno de servidor (Node.js)
// Solo inicializar una vez para evitar múltiples intervals
if (typeof setInterval !== 'undefined' && typeof window === 'undefined') {
  if (!globalForSessions.cleanupInterval) {
    globalForSessions.cleanupInterval = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);
    console.log('🧹 Limpieza automática de sesiones iniciada (cada 5 minutos)');
  }
}

/**
 * Registra una nueva sesión para un usuario
 * - Reutiliza sesiones existentes del mismo dispositivo (deviceId)
 * - Permite cambio de IP del mismo dispositivo sin invalidar sesión
 * - Solo invalida sesiones cuando hay sesiones simultáneas desde 2 o más IPs diferentes
 * 
 * @param userId - ID del usuario
 * @param email - Email del usuario
 * @param ipAddress - IP del cliente
 * @param deviceId - ID único del dispositivo
 * @returns Objeto con sessionId y lista de sesiones invalidadas
 */
export function registerSession(
  userId: string,
  email: string,
  ipAddress: string,
  deviceId: string
): { sessionId: string; invalidatedSessions: string[] } {
  const userSessionIds = userSessions.get(userId) || new Set<string>();
  const invalidatedSessions: string[] = [];
  const now = new Date();

  // PASO 1: Buscar sesión existente válida con el mismo deviceId
  let existingSession: UserSession | undefined;
  userSessionIds.forEach(sessionId => {
    const session = sessions.get(sessionId);
    if (session && session.isValid && session.deviceId === deviceId) {
      // Verificar que no esté expirada
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      if (timeSinceLastActivity <= SESSION_EXPIRATION_MS) {
        existingSession = session;
      }
    }
  });

  // PASO 2: Si existe sesión válida del mismo dispositivo, reutilizarla
  if (existingSession) {
    // Actualizar IP si cambió (mismo dispositivo, IP diferente - permitido)
    if (existingSession.ipAddress !== ipAddress) {
      console.log(`ℹ️ Sesión ${existingSession.sessionId}: IP cambió de ${existingSession.ipAddress} a ${ipAddress} (mismo dispositivo, permitido)`);
      existingSession.ipAddress = ipAddress;
    }
    
    // Actualizar lastActivity y email por si cambió
    existingSession.lastActivity = now;
    existingSession.email = email;

    console.log(`✅ Sesión existente reutilizada: ${existingSession.sessionId} para usuario ${userId} (deviceId: ${deviceId}, IP: ${ipAddress})`);

    // PASO 3: Verificar si hay sesiones simultáneas desde múltiples IPs diferentes
    // Obtener todas las sesiones activas del usuario
    // Nota: existingSession ya tiene la IP actualizada (ipAddress), así que getUserSessions la incluirá correctamente
    const activeSessions = getUserSessions(userId);
    
    // Contar IPs únicas de todas las sesiones activas
    // existingSession.ipAddress ya está actualizado a ipAddress, así que se contará correctamente
    const uniqueIPs = new Set<string>();
    activeSessions.forEach(session => {
      if (session.isValid) {
        uniqueIPs.add(session.ipAddress);
      }
    });

    // Si hay 2 o más IPs diferentes simultáneas, invalidar todas excepto la más reciente
    if (uniqueIPs.size >= 2) {
      console.log(`⚠️ Detectadas ${uniqueIPs.size} IPs diferentes simultáneas (${Array.from(uniqueIPs).join(', ')}). Invalidando sesiones antiguas...`);
      
      // Ordenar sesiones por lastActivity (más reciente primero)
      // La sesión actual tiene lastActivity = now, así que será la más reciente
      const sortedSessions = [...activeSessions].sort((a, b) => 
        b.lastActivity.getTime() - a.lastActivity.getTime()
      );

      // Invalidar todas excepto la más reciente (que es la actual)
      sortedSessions.forEach(session => {
        if (session.sessionId !== existingSession!.sessionId && session.isValid) {
          session.isValid = false;
          invalidatedSessions.push(session.sessionId);
          console.log(`🔒 Sesión ${session.sessionId} invalidada: múltiples IPs simultáneas (IP: ${session.ipAddress})`);
        }
      });
    }

    return {
      sessionId: existingSession.sessionId,
      invalidatedSessions,
    };
  }

  // PASO 4: No existe sesión válida del mismo dispositivo, crear nueva
  // Pero primero verificar si hay sesiones simultáneas desde múltiples IPs diferentes
  const activeSessions = getUserSessions(userId);
  const uniqueIPs = new Set<string>();
  activeSessions.forEach(session => {
    if (session.isValid) {
      uniqueIPs.add(session.ipAddress);
    }
  });
  uniqueIPs.add(ipAddress);

  // Si hay 2 o más IPs diferentes simultáneas, invalidar todas las anteriores
  if (uniqueIPs.size >= 2) {
    console.log(`⚠️ Detectadas ${uniqueIPs.size} IPs diferentes simultáneas. Invalidando sesiones anteriores...`);
    
    activeSessions.forEach(session => {
      if (session.isValid) {
        session.isValid = false;
        invalidatedSessions.push(session.sessionId);
        console.log(`🔒 Sesión ${session.sessionId} invalidada: múltiples IPs simultáneas (IP: ${session.ipAddress})`);
      }
    });
  }

  // Crear nueva sesión
  const sessionId = generateSessionId();
  
  const newSession: UserSession = {
    userId,
    email,
    ipAddress,
    deviceId,
    sessionId,
    createdAt: now,
    lastActivity: now,
    isValid: true,
  };

  sessions.set(sessionId, newSession);

  // Actualizar índice de sesiones por usuario
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new Set<string>());
  }
  userSessions.get(userId)!.add(sessionId);

  console.log(`✅ Nueva sesión registrada: ${sessionId} para usuario ${userId} (deviceId: ${deviceId}, IP: ${ipAddress})`);
  console.log(`🔍 Debug: Sesión guardada correctamente. Total sesiones: ${sessions.size}, Sesiones del usuario: ${userSessions.get(userId)?.size || 0}`);

  return {
    sessionId,
    invalidatedSessions,
  };
}

/**
 * Valida una sesión existente
 * - Verifica que la sesión existe y es válida
 * - Verifica que el deviceId coincide (si no coincide, invalida la sesión)
 * - Si deviceId coincide pero IP cambió: PERMITE (mismo dispositivo, IP diferente)
 * - Si deviceId es diferente: DENIEGA (diferente dispositivo)
 * - Actualiza lastActivity si es válida
 * 
 * @param sessionId - ID de la sesión a validar
 * @param userId - ID del usuario (opcional, para validación adicional)
 * @param ipAddress - IP actual del cliente
 * @param deviceId - ID del dispositivo actual
 * @returns true si la sesión es válida, false en caso contrario
 */
export function validateSession(
  sessionId: string,
  userId?: string,
  ipAddress?: string,
  deviceId?: string
): boolean {
  const session = sessions.get(sessionId);

  // Si la sesión no existe, no es válida
  if (!session) {
    console.log(`❌ Sesión ${sessionId} no encontrada`);
    console.log(`🔍 Debug: Total de sesiones en memoria: ${sessions.size}`);
    console.log(`🔍 Debug: Sesiones activas:`, Array.from(sessions.entries()).map(([id, s]) => ({
      sessionId: id,
      userId: s.userId,
      isValid: s.isValid,
      deviceId: s.deviceId,
      ipAddress: s.ipAddress
    })));
    return false;
  }

  // Si la sesión ya está marcada como inválida, no es válida
  if (!session.isValid) {
    console.log(`❌ Sesión ${sessionId} está invalidada`);
    return false;
  }

  // Verificar expiración (24 horas de inactividad)
  const now = Date.now();
  const timeSinceLastActivity = now - session.lastActivity.getTime();
  if (timeSinceLastActivity > SESSION_EXPIRATION_MS) {
    console.log(`❌ Sesión ${sessionId} expirada (${Math.round(timeSinceLastActivity / 1000 / 60)} minutos de inactividad)`);
    session.isValid = false;
    return false;
  }

  // Si se proporciona userId, verificar que coincida
  if (userId && session.userId !== userId) {
    console.log(`❌ Sesión ${sessionId} no pertenece al usuario ${userId}`);
    session.isValid = false;
    return false;
  }

  // Si se proporciona deviceId, validar que coincida
  if (deviceId) {
    if (session.deviceId !== deviceId) {
      // DeviceId diferente: DENEGAR (diferente dispositivo)
      console.log(`❌ Sesión ${sessionId} invalidada: deviceId diferente (${session.deviceId} vs ${deviceId})`);
      session.isValid = false;
      return false;
    }
    // DeviceId coincide: PERMITIR (aunque IP haya cambiado)
    // Esto permite que el mismo dispositivo mantenga sesión aunque cambie la IP
  }

  // Si se proporciona IP pero no deviceId, solo registrar cambio de IP (no invalidar)
  if (ipAddress && session.ipAddress !== ipAddress) {
    console.log(`ℹ️ Sesión ${sessionId}: IP cambió de ${session.ipAddress} a ${ipAddress} (permitido)`);
    // No invalidamos, solo actualizamos la IP registrada
    session.ipAddress = ipAddress;
  }

  // Sesión válida: actualizar lastActivity
  session.lastActivity = new Date();
  return true;
}

/**
 * Obtiene una sesión por su ID
 * 
 * @param sessionId - ID de la sesión
 * @returns Sesión o undefined si no existe
 */
export function getSession(sessionId: string): UserSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Invalida una sesión específica
 * 
 * @param sessionId - ID de la sesión a invalidar
 * @returns true si la sesión fue invalidada, false si no existía
 */
export function invalidateSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  
  if (!session) {
    console.log(`⚠️ Intento de invalidar sesión ${sessionId} que no existe`);
    return false;
  }

  session.isValid = false;

  // Remover del índice de sesiones por usuario (pero mantener en sessions para debugging)
  const userSessionIds = userSessions.get(session.userId);
  if (userSessionIds) {
    userSessionIds.delete(sessionId);
    if (userSessionIds.size === 0) {
      userSessions.delete(session.userId);
    }
  }

  // NO eliminar de sessions para poder debuggear
  // sessions.delete(sessionId);

  console.log(`🔒 Sesión ${sessionId} invalidada (marcada como inválida, pero mantenida en memoria para debugging)`);
  return true;
}

/**
 * Invalida todas las sesiones de un usuario
 * 
 * @param userId - ID del usuario
 * @returns Número de sesiones invalidadas
 */
export function invalidateUserSessions(userId: string): number {
  const userSessionIds = userSessions.get(userId);
  
  if (!userSessionIds || userSessionIds.size === 0) {
    return 0;
  }

  const sessionIds = Array.from(userSessionIds);
  let count = 0;

  sessionIds.forEach(sessionId => {
    if (invalidateSession(sessionId)) {
      count++;
    }
  });

  console.log(`🔒 ${count} sesiones invalidadas para usuario ${userId}`);
  return count;
}

/**
 * Obtiene todas las sesiones activas de un usuario
 * 
 * @param userId - ID del usuario
 * @returns Array de sesiones activas
 */
export function getUserSessions(userId: string): UserSession[] {
  const userSessionIds = userSessions.get(userId);
  
  if (!userSessionIds) {
    return [];
  }

  const activeSessions: UserSession[] = [];
  
  userSessionIds.forEach(sessionId => {
    const session = sessions.get(sessionId);
    if (session && session.isValid) {
      activeSessions.push(session);
    }
  });

  return activeSessions;
}

/**
 * Recupera o recrea una sesión cuando se detecta que se perdió pero el usuario está autenticado
 * Útil para recuperar sesiones después de hot reload en desarrollo
 * 
 * @param userId - ID del usuario
 * @param email - Email del usuario
 * @param ipAddress - IP actual del cliente
 * @param deviceId - ID del dispositivo
 * @returns sessionId de la sesión recuperada o recreada
 */
export function recoverSession(
  userId: string,
  email: string,
  ipAddress: string,
  deviceId: string
): string {
  console.log(`🔄 Intentando recuperar sesión para usuario ${userId} (deviceId: ${deviceId})`);
  
  // Primero intentar encontrar una sesión existente válida del mismo dispositivo
  const userSessionIds = userSessions.get(userId);
  if (userSessionIds) {
    for (const sessionId of userSessionIds) {
      const session = sessions.get(sessionId);
      if (session && session.deviceId === deviceId && session.isValid) {
        // Verificar que no esté expirada
        const now = Date.now();
        const timeSinceLastActivity = now - session.lastActivity.getTime();
        if (timeSinceLastActivity <= SESSION_EXPIRATION_MS) {
          // Sesión válida encontrada, actualizarla
          session.lastActivity = new Date();
          session.ipAddress = ipAddress;
          session.email = email;
          console.log(`✅ Sesión recuperada: ${sessionId} (existente)`);
          return sessionId;
        }
      }
    }
  }
  
  // No se encontró sesión válida, crear una nueva
  console.log(`⚠️ No se encontró sesión válida, creando nueva sesión para recuperación`);
  const { sessionId } = registerSession(userId, email, ipAddress, deviceId);
  console.log(`✅ Nueva sesión creada para recuperación: ${sessionId}`);
  return sessionId;
}

/**
 * Obtiene estadísticas del gestor de sesiones (útil para debugging)
 */
export function getSessionStats(): {
  totalSessions: number;
  activeSessions: number;
  totalUsers: number;
} {
  let activeSessions = 0;
  
  sessions.forEach(session => {
    if (session.isValid) {
      activeSessions++;
    }
  });

  return {
    totalSessions: sessions.size,
    activeSessions,
    totalUsers: userSessions.size,
  };
}

