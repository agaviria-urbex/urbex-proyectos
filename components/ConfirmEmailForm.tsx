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
import { confirmSignUpWithCode, resendConfirmationCode } from '@/lib/auth';
import { Loader2, AlertCircle, CheckCircle2, Mail, Info } from 'lucide-react';
import { URBEX_CONTACT } from '@/lib/amplify-config';

const confirmEmailSchema = z.object({
  code: z.string().min(6, 'El código debe tener al menos 6 dígitos'),
});

type ConfirmEmailFormData = z.infer<typeof confirmEmailSchema>;

interface ConfirmEmailFormProps {
  email: string;
  onBackToLogin: () => void;
}

export function ConfirmEmailForm({ email, onBackToLogin }: ConfirmEmailFormProps) {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmEmailFormData>({
    resolver: zodResolver(confirmEmailSchema),
  });

  const onSubmit = async (data: ConfirmEmailFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await confirmSignUpWithCode({ email, code: data.code });
      setSuccess('¡Email confirmado exitosamente!');
      setIsConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    try {
      await resendConfirmationCode(email);
      setSuccess('Código reenviado. Revisa tu email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reenviar código');
    } finally {
      setIsResending(false);
    }
  };

  if (isConfirmed) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-6 w-6" />
            Cuenta confirmada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Pendiente de aprobación</AlertTitle>
            <AlertDescription>
              Tu cuenta está pendiente de aprobación manual. Contacta a {URBEX_CONTACT.name} al{' '}
              {URBEX_CONTACT.phoneFormatted}.
            </AlertDescription>
          </Alert>
          <Button onClick={onBackToLogin} className="w-full bg-[#a738cd] hover:bg-[#8c2ca3]">
            Ir a Iniciar Sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Confirmar Email
        </CardTitle>
        <CardDescription>
          Ingresa el código enviado a <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código de verificación</Label>
            <Input
              id="code"
              placeholder="123456"
              {...register('code')}
              disabled={isLoading}
            />
            {errors.code && (
              <p className="text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full bg-[#a738cd] hover:bg-[#8c2ca3]" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Email
          </Button>
        </form>

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="outline" onClick={handleResend} disabled={isResending}>
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reenviar código
          </Button>
          <Button variant="ghost" onClick={onBackToLogin}>
            Volver a Iniciar Sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
