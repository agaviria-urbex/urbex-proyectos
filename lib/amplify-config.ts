/**
 * Configuración de AWS Amplify para autenticación con Cognito
 * User Pool: urbex-app-users
 * Region: us-east-2 (Ohio)
 * 
 * Lee las credenciales desde variables de entorno
 */

// Valores por defecto (fallback si no hay variables de entorno)
const DEFAULT_USER_POOL_ID = 'us-east-2_Fpda5LMX0';
const DEFAULT_CLIENT_ID = '5kvmdd29oj2lpnq9b4j60gfe69';

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || DEFAULT_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || DEFAULT_CLIENT_ID,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

/**
 * Estados de cuenta de usuario
 * - pending: Usuario registrado pero esperando aprobación manual
 * - active: Usuario aprobado y puede acceder
 * - disabled: Usuario desactivado manualmente
 */
export enum AccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

/**
 * Información de contacto para usuarios pendientes/desactivados
 */
export const URBEX_CONTACT = {
  name: 'Jose Molina',
  phone: '+573017524687',
  phoneFormatted: '+57 301 752 4687',
  whatsappLink: 'https://wa.me/573017524687',
  message: 'Hola, me gustaría obtener acceso a la plataforma Urbex.'
};

/**
 * Configuración del almacenamiento de tokens
 * Se almacenan en localStorage para mantener sesión persistente
 */
export const authStorageConfig = {
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
};
