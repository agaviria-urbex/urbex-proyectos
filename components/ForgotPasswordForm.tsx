'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { forgotPassword, confirmForgotPassword, validatePassword } from '@/lib/auth';
import { Loader2, AlertCircle, CheckCircle2, KeyRound, Mail, Info } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

const resetPasswordSchema = z.object({
  code: z.string().min(6, 'El código debe tener al menos 6 dígitos'),
  newPassword: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail }
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema)
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    watch,
    reset: resetResetForm,
    formState: { errors: errorsReset }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  // Validar contraseña en tiempo real
  const newPassword = watch('newPassword');
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    if (pwd) {
      setPasswordValidation(validatePassword(pwd));
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  };

  const onSubmitEmail = async (data: EmailFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await forgotPassword({ email: data.email });
      setEmail(data.email);
      // Mantener loading mientras cambia de vista
      setSuccess('Código enviado. Revisa tu email.');
      
      // Cambiar a la vista de reset después de un momento
      setTimeout(() => {
        setStep('reset');
        setSuccess('');
        setIsLoading(false);
        // Limpiar el formulario de reset para que los campos estén vacíos
        resetResetForm();
        setPasswordValidation({ isValid: false, errors: [] });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar recuperación');
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data: ResetPasswordFormData) => {
    // Validar que la contraseña cumpla los requisitos ANTES de enviar
    const validation = validatePassword(data.newPassword);
    if (!validation.isValid) {
      setError('La contraseña no cumple con todos los requisitos de seguridad. Por favor, corrígela.');
      return; // NO cambiar de vista, mantener al usuario aquí para que corrija
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await confirmForgotPassword({
        email,
        code: data.code,
        newPassword: data.newPassword,
      });
      
      setSuccess('¡Contraseña cambiada exitosamente!');
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err) {
      // Si hay error de Cognito (código incorrecto, expirado, etc), mostrar error
      // pero NO volver a la vista anterior - permitir que corrija el código
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {step === 'email' ? (
            <>
              <Mail className="h-5 w-5" />
              Recuperar Contraseña
            </>
          ) : (
            <>
              <KeyRound className="h-5 w-5" />
              Restablecer Contraseña
            </>
          )}
        </CardTitle>
        <CardDescription>
          {step === 'email' 
            ? 'Ingresa tu email para recibir un código de recuperación'
            : 'Ingresa el código y tu nueva contraseña'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'email' ? (
          <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...registerEmail('email')}
                disabled={isLoading}
              />
              {errorsEmail.email && (
                <p className="text-sm text-red-600">{errorsEmail.email.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Enviando código...' : 'Enviar código'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onBackToLogin}
              disabled={isLoading}
              className="w-full"
            >
              Volver al inicio de sesión
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitReset(onSubmitReset)} className="space-y-4">
            {/* Información sobre requisitos de contraseña */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-200 text-sm font-semibold mb-1">
                Requisitos de la Contraseña
              </AlertTitle>
              <AlertDescription className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p>Tu nueva contraseña debe contener:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Mínimo 4 caracteres</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="code">Código de verificación</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                maxLength={6}
                {...registerReset('code')}
                disabled={isLoading}
                className="text-center text-lg tracking-widest"
              />
              {errorsReset.code && (
                <p className="text-sm text-red-600">{errorsReset.code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Revisa tu email {email}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Ingresa tu nueva contraseña"
                {...registerReset('newPassword')}
                onChange={handlePasswordChange}
                disabled={isLoading}
              />
              {errorsReset.newPassword && (
                <p className="text-sm text-red-600">{errorsReset.newPassword.message}</p>
              )}

              {/* Indicador de validación en tiempo real */}
              {newPassword && (
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md text-xs space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Validación de contraseña:
                  </p>
                  {passwordValidation.errors.map((error, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      <span>{error}</span>
                    </div>
                  ))}
                  {passwordValidation.isValid && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>✓ Contraseña válida - Cumple todos los requisitos</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirma tu nueva contraseña"
                {...registerReset('confirmPassword')}
                disabled={isLoading}
              />
              {errorsReset.confirmPassword && (
                <p className="text-sm text-red-600">{errorsReset.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !!success}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cambiar contraseña
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep('email');
                setError('');
                setSuccess('');
                setPasswordValidation({ isValid: false, errors: [] });
              }}
              disabled={isLoading || !!success}
              className="w-full"
            >
              Usar otro email
            </Button>
          </form>
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>💡 Consejo:</strong> Si no recibes el código, revisa tu carpeta de spam o correo no deseado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
