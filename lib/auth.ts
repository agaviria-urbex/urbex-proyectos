/**
 * Módulo de autenticación con AWS Cognito
 * Incluye: Login, Registro, Logout, Recuperación de contraseña, Confirmación de email
 * Sistema de activación manual de usuarios
 * Sistema de control de sesiones por dispositivo
 */

import { Amplify } from 'aws-amplify';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchUserAttributes,
  updateUserAttributes,
  type SignInOutput,
  type SignUpOutput,
} from 'aws-amplify/auth';
import { amplifyConfig, AccountStatus, URBEX_CONTACT } from './amplify-config';

// Configurar Amplify solo en el cliente
if (typeof window !== 'undefined') {
  Amplify.configure(amplifyConfig, { ssr: true });
}

// Error personalizado para usuarios desactivados/pendientes
export class AccountNotActiveError extends Error {
  accountStatus: AccountStatus;
  
  constructor(status: AccountStatus) {
    super('Tu cuenta no está activa');
    this.name = 'AccountNotActiveError';
    this.accountStatus = status;
  }
}

// Tipos
export interface User {
  id: string;
  email: string;
  nombre: string;
  celular: string;
  emailVerified?: boolean;
  accountStatus?: AccountStatus;
  plan?: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  celular: string;
}

export interface ConfirmSignUpData {
  email: string;
  code: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

/**
 * Login - Iniciar sesión con email y contraseña
 * Verifica que la cuenta esté activa antes de permitir el acceso
 */
export const login = async (data: LoginData): Promise<User> => {
  try {
    const { isSignedIn, nextStep }: SignInOutput = await signIn({
      username: data.email,
      password: data.password,
    });

    if (!isSignedIn) {
      // Manejar casos especiales como confirmación pendiente
      if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        throw new Error('Por favor confirma tu email antes de iniciar sesión');
      }
      throw new Error('No se pudo iniciar sesión. Verifica tus credenciales.');
    }

    // Obtener información del usuario
    const user = await getUserInfo();
    
    // Verificar estado de la cuenta
    const accountStatus = user.accountStatus || AccountStatus.PENDING;
    
    if (accountStatus === AccountStatus.PENDING) {
      // Cerrar sesión inmediatamente
      await signOut();
      throw new AccountNotActiveError(AccountStatus.PENDING);
    }
    
    if (accountStatus === AccountStatus.DISABLED) {
      // Cerrar sesión inmediatamente
      await signOut();
      throw new AccountNotActiveError(AccountStatus.DISABLED);
    }
    
    // Si llegamos aquí, la cuenta está activa
    // Registrar sesión en el sistema de control de sesiones
    await registerUserSession(user.id, user.email);
    
    return user;
  } catch (error: any) {
    console.error('Error en login:', error);
    
    // Si es error de cuenta no activa, propagarlo
    if (error instanceof AccountNotActiveError) {
      throw error;
    }
    
    // Mensajes de error personalizados
    if (error.name === 'NotAuthorizedException') {
      throw new Error('Email o contraseña incorrectos');
    } else if (error.name === 'UserNotFoundException') {
      throw new Error('Usuario no encontrado');
    } else if (error.name === 'UserNotConfirmedException') {
      throw new Error('Por favor confirma tu email antes de iniciar sesión');
    }
    
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

/**
 * Registro - Crear nueva cuenta
 * Por defecto, el usuario se crea con estado "pending" para aprobación manual
 */
export const register = async (data: RegisterData): Promise<{ user: User; requiresConfirmation: boolean }> => {
  try {
    const { isSignUpComplete, userId, nextStep }: SignUpOutput = await signUp({
      username: data.email,
      password: data.password,
      options: {
        userAttributes: {
          email: data.email,
          name: data.nombre,
          phone_number: formatPhoneNumber(data.celular),
          // Atributo custom para estado de cuenta (pending por defecto)
          // NOTA: Este atributo debe estar configurado en el User Pool de Cognito
          'custom:accountStatus': AccountStatus.PENDING,
        },
      },
    });

    // Usuario creado pero necesita confirmar email
    const user: User = {
      id: userId || '',
      email: data.email,
      nombre: data.nombre,
      celular: data.celular,
      emailVerified: false,
      accountStatus: AccountStatus.PENDING,
    };

    return {
      user,
      requiresConfirmation: !isSignUpComplete,
    };
  } catch (error: any) {
    console.error('Error en registro:', error);
    
    // Si el atributo custom no está configurado, intentar sin él
    if (error.name === 'InvalidParameterException' && error.message.includes('custom:accountStatus')) {
      console.warn('El atributo custom:accountStatus no está configurado en Cognito. Registrando sin él...');
      
      // Reintentar sin el atributo custom
      try {
        const { isSignUpComplete, userId }: SignUpOutput = await signUp({
          username: data.email,
          password: data.password,
          options: {
            userAttributes: {
              email: data.email,
              name: data.nombre,
              phone_number: formatPhoneNumber(data.celular),
            },
          },
        });

        const user: User = {
          id: userId || '',
          email: data.email,
          nombre: data.nombre,
          celular: data.celular,
          emailVerified: false,
          accountStatus: AccountStatus.PENDING,
        };

        return {
          user,
          requiresConfirmation: !isSignUpComplete,
        };
      } catch (retryError: any) {
        console.error('Error en segundo intento de registro:', retryError);
        throw retryError;
      }
    }
    
    // Mensajes de error personalizados
    if (error.name === 'UsernameExistsException') {
      throw new Error('Este email ya está registrado');
    } else if (error.name === 'InvalidPasswordException') {
      throw new Error('La contraseña no cumple con los requisitos de seguridad');
    } else if (error.name === 'InvalidParameterException') {
      throw new Error('Datos inválidos. Verifica el formato del email y teléfono');
    }
    
    throw new Error(error.message || 'Error al registrar usuario');
  }
};

/**
 * Confirmar registro con código de email
 */
export const confirmSignUpWithCode = async (data: ConfirmSignUpData): Promise<void> => {
  try {
    await confirmSignUp({
      username: data.email,
      confirmationCode: data.code,
    });
  } catch (error: any) {
    console.error('Error en confirmación:', error);
    
    if (error.name === 'CodeMismatchException') {
      throw new Error('Código incorrecto. Verifica e intenta nuevamente');
    } else if (error.name === 'ExpiredCodeException') {
      throw new Error('El código ha expirado. Solicita uno nuevo');
    }
    
    throw new Error(error.message || 'Error al confirmar email');
  }
};

/**
 * Reenviar código de confirmación
 */
export const resendConfirmationCode = async (email: string): Promise<void> => {
  try {
    await resendSignUpCode({
      username: email,
    });
  } catch (error: any) {
    console.error('Error al reenviar código:', error);
    throw new Error(error.message || 'Error al reenviar código de confirmación');
  }
};

/**
 * Iniciar proceso de recuperación de contraseña
 */
export const forgotPassword = async (data: ForgotPasswordData): Promise<void> => {
  try {
    await resetPassword({
      username: data.email,
    });
  } catch (error: any) {
    console.error('Error en forgot password:', error);
    
    if (error.name === 'UserNotFoundException') {
      throw new Error('No existe una cuenta con este email');
    } else if (error.name === 'LimitExceededException') {
      throw new Error('Demasiados intentos. Intenta más tarde');
    }
    
    throw new Error(error.message || 'Error al solicitar recuperación de contraseña');
  }
};

/**
 * Confirmar nueva contraseña con código
 */
export const confirmForgotPassword = async (data: ResetPasswordData): Promise<void> => {
  try {
    await confirmResetPassword({
      username: data.email,
      confirmationCode: data.code,
      newPassword: data.newPassword,
    });
  } catch (error: any) {
    console.error('Error al confirmar nueva contraseña:', error);
    
    if (error.name === 'CodeMismatchException') {
      throw new Error('Código incorrecto. Verifica e intenta nuevamente');
    } else if (error.name === 'ExpiredCodeException') {
      throw new Error('El código ha expirado. Solicita uno nuevo');
    } else if (error.name === 'InvalidPasswordException') {
      throw new Error('La contraseña no cumple con los requisitos de seguridad');
    }
    
    throw new Error(error.message || 'Error al cambiar contraseña');
  }
};

/**
 * Logout - Cerrar sesión
 */
export const logout = async (): Promise<void> => {
  try {
    // Intentar invalidar sesión en el servidor antes de cerrar sesión
    if (typeof window !== 'undefined') {
      const sessionId = localStorage.getItem('urbex_session_id');
      
      if (sessionId) {
        try {
          // Obtener userId si está disponible
          let userId: string | undefined;
          try {
            const currentUser = await getCurrentUser();
            userId = currentUser.userId;
          } catch {
            // Si no hay usuario, continuar con logout
          }

          // Invalidar sesión en el servidor
          await fetch('/api/session', {
            method: 'DELETE',
            headers: {
              ...(sessionId && { 'x-session-id': sessionId }),
              ...(userId && { 'x-user-id': userId }),
            },
          });
        } catch (error) {
          // No fallar el logout si hay error invalidando sesión
          console.error('Error invalidando sesión en servidor (no crítico):', error);
        }

        // Limpiar sessionId de localStorage
        localStorage.removeItem('urbex_session_id');
        
        // Opcional: limpiar deviceId si se desea (comentado para mantener persistencia)
        // localStorage.removeItem('urbex_device_id');
      }
    }

    // Cerrar sesión de Cognito
    await signOut();
  } catch (error: any) {
    console.error('Error en logout:', error);
    throw new Error(error.message || 'Error al cerrar sesión');
  }
};

/**
 * Obtener información del usuario actual
 */
export const getUserInfo = async (): Promise<User> => {
  try {
    const currentUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    // Obtener estado de cuenta del atributo custom (si existe)
    const accountStatus = (attributes['custom:accountStatus'] as AccountStatus) || AccountStatus.PENDING;
    const plan = (attributes['custom:plan'] as string) || null;

    const user: User = {
      id: currentUser.userId,
      email: attributes.email || '',
      nombre: attributes.name || '',
      celular: attributes.phone_number || '',
      emailVerified: attributes.email_verified === 'true',
      accountStatus: accountStatus,
      plan,
    };

    return user;
  } catch (error: any) {
    console.error('Error obteniendo información del usuario:', error);
    throw new Error('No se pudo obtener la información del usuario');
  }
};

/**
 * Verificar si hay un usuario autenticado (sesión activa)
 * 
 * NOTA: Esta función NO valida la sesión del sistema de control de sesiones.
 * La validación de sesión ahora se realiza únicamente cuando el usuario hace clic
 * en "Buscar" en los módulos. Esto es más eficiente y reduce llamadas innecesarias a la API.
 */
export const checkAuthStatus = async (): Promise<User | null> => {
  try {
    const user = await getUserInfo();
    
    // Verificar que la cuenta esté activa
    if (user.accountStatus && user.accountStatus !== AccountStatus.ACTIVE) {
      // Si la cuenta no está activa, cerrar sesión
      await signOut();
      return null;
    }
    
    // NO validar sesión aquí - la validación se hace en los botones "Buscar"
    // Esto evita validaciones periódicas innecesarias
    
    return user;
  } catch (error) {
    // No hay sesión activa
    return null;
  }
};

/**
 * Actualizar atributos del usuario
 */
export const updateUserInfo = async (attributes: {
  name?: string;
  phone_number?: string;
}): Promise<void> => {
  try {
    await updateUserAttributes({
      userAttributes: attributes,
    });
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    throw new Error(error.message || 'Error al actualizar información');
  }
};

/**
 * Obtiene o crea un deviceId único para el dispositivo actual
 * El deviceId se almacena en localStorage y persiste entre sesiones
 * 
 * @returns deviceId único del dispositivo
 */
export const getOrCreateDeviceId = (): string => {
  // Solo funciona en el cliente
  if (typeof window === 'undefined') {
    // En servidor, retornar un ID temporal (no debería usarse en servidor)
    return 'server-temp-id';
  }

  const STORAGE_KEY = 'urbex_device_id';
  
  // Intentar obtener deviceId existente
  const existingDeviceId = localStorage.getItem(STORAGE_KEY);
  
  if (existingDeviceId) {
    return existingDeviceId;
  }

  // Generar nuevo deviceId (UUID v4)
  let deviceId: string;
  
  // Intentar usar crypto.randomUUID() si está disponible
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    deviceId = crypto.randomUUID();
  } else {
    // Fallback: generar UUID v4 manualmente
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Guardar en localStorage
  localStorage.setItem(STORAGE_KEY, deviceId);
  
  return deviceId;
};

/**
 * Registra una sesión de usuario en el servidor
 * 
 * @param userId - ID del usuario
 * @param email - Email del usuario
 */
export const registerUserSession = async (userId: string, email: string): Promise<void> => {
  try {
    // Solo funciona en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    const deviceId = getOrCreateDeviceId();

    // Llamar al endpoint de registro de sesión
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        deviceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error registrando sesión:', error);
      return;
    }

    const data = await response.json();
    
    // Guardar sessionId en localStorage
    if (data.sessionId) {
      localStorage.setItem('urbex_session_id', data.sessionId);
    }

    // Si se invalidaron sesiones de otros dispositivos, log informativo
    if (data.invalidatedSessions && data.invalidatedSessions.length > 0) {
      console.log(`ℹ️ ${data.invalidatedSessions.length} sesión(es) de otros dispositivos fueron invalidadas`);
    }

    console.log('✅ Sesión registrada exitosamente');
  } catch (error: any) {
    // No fallar el login si hay error registrando sesión
    console.error('Error registrando sesión (no crítico):', error);
  }
};

/**
 * Valida la sesión del usuario actual
 * 
 * @returns true si la sesión es válida, false en caso contrario
 */
export const validateUserSession = async (): Promise<boolean> => {
  try {
    // Solo funciona en el cliente
    if (typeof window === 'undefined') {
      return true; // En servidor, asumir válido
    }

    const sessionId = localStorage.getItem('urbex_session_id');
    const deviceId = getOrCreateDeviceId();

    // Si no hay sessionId, permitir sesión (modo compatibilidad con sesiones antiguas)
    if (!sessionId) {
      return true;
    }

    // Obtener userId y email del usuario actual (si está disponible)
    let userId: string | undefined;
    let userEmail: string | undefined;
    try {
      const currentUser = await getCurrentUser();
      userId = currentUser.userId;
      
      // Obtener email del usuario para recuperación de sesión
      try {
        const userInfo = await getUserInfo();
        userEmail = userInfo.email;
      } catch {
        // Si no se puede obtener email, continuar sin él (la recuperación no funcionará)
        console.warn('⚠️ No se pudo obtener email del usuario para recuperación de sesión');
      }
    } catch {
      // Si no hay usuario autenticado, la sesión no es válida
      return false;
    }

    // Llamar al endpoint de validación (incluye email para recuperación automática)
    const response = await fetch('/api/session/validate', {
      method: 'GET',
      headers: {
        'x-session-id': sessionId,
        'x-user-id': userId,
        'x-device-id': deviceId,
        ...(userEmail ? { 'x-user-email': userEmail } : {}),
      },
    });

    if (!response.ok) {
      console.error('Error validando sesión:', response.status);
      return false;
    }

    const data = await response.json();

    if (!data.valid) {
      // Si la sesión fue recuperada pero aún es inválida, limpiar
      if (data.recovered) {
        console.log('⚠️ Sesión recuperada pero aún inválida, limpiando...');
      }
      // Sesión inválida: limpiar sessionId
      localStorage.removeItem('urbex_session_id');
      console.log('❌ Sesión invalidada:', data.message);
      return false;
    }

    // Si la sesión fue recuperada, actualizar el sessionId en localStorage
    if (data.recovered && data.sessionId && data.sessionId !== sessionId) {
      console.log(`✅ Sesión recuperada: actualizando sessionId de ${sessionId} a ${data.sessionId}`);
      localStorage.setItem('urbex_session_id', data.sessionId);
    }

    // Sesión válida
    return true;
  } catch (error: any) {
    console.error('Error validando sesión:', error);
    // En caso de error, asumir válido para no interrumpir la experiencia
    return true;
  }
};

/**
 * Formatear número de teléfono para Cognito (formato E.164)
 * Ejemplo: 3001234567 -> +573001234567
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remover espacios y caracteres especiales
  let cleaned = phone.replace(/\D/g, '');
  
  // Si empieza con 57 (código de Colombia), agregar +
  if (cleaned.startsWith('57')) {
    return '+' + cleaned;
  }
  
  // Si no tiene código de país, asumir Colombia (+57)
  if (!cleaned.startsWith('+')) {
    return '+57' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validar formato de email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar requisitos de contraseña
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  if (password.length < 4) {
    errors.push('Mínimo 4 caracteres');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Verificar si el usuario tiene acceso al grupo @urbex (consola de administración)
 * 
 * @returns true si el usuario tiene el grupo @urbex, false en caso contrario
 */
export const checkUrbexGroupAccess = async (): Promise<boolean> => {
  try {
    const attributes = await fetchUserAttributes();
    
    // Obtener el atributo custom:Group
    const userGroup = attributes['custom:Group'] || '';
    
    // Verificar que contenga @urbex
    return userGroup.includes('@urbex');
  } catch (error) {
    console.error('Error verificando acceso al grupo @urbex:', error);
    return false;
  }
};

/**
 * Obtener mensaje de error para cuenta no activa
 */
export const getAccountNotActiveMessage = (status: AccountStatus): string => {
  if (status === AccountStatus.PENDING) {
    return `Tu cuenta está pendiente de aprobación. Para obtener acceso, contacta a nuestro equipo comercial: ${URBEX_CONTACT.name} al ${URBEX_CONTACT.phoneFormatted}`;
  }
  
  if (status === AccountStatus.DISABLED) {
    return `Tu cuenta ha sido desactivada. Para más información, contacta a nuestro equipo comercial: ${URBEX_CONTACT.name} al ${URBEX_CONTACT.phoneFormatted}`;
  }
  
  return 'Tu cuenta no está activa.';
};
