'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccountNotActiveAlert } from '@/components/AccountNotActiveAlert';
import { login, AccountNotActiveError } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { AccountStatus } from '@/lib/amplify-config';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onToggleForm: () => void;
  onForgotPassword: () => void;
}

export function LoginForm({ onToggleForm, onForgotPassword }: LoginFormProps) {
  const [error, setError] = useState<string>('');
  const [accountNotActiveStatus, setAccountNotActiveStatus] = useState<AccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { login: setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones para continuar');
      return;
    }

    setIsLoading(true);
    setError('');
    setAccountNotActiveStatus(null);

    try {
      const user = await login(data);
      setUser(user);
    } catch (err) {
      if (err instanceof AccountNotActiveError) {
        setAccountNotActiveStatus(err.accountStatus);
        return;
      }
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a Urbex Proyectos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accountNotActiveStatus && (
          <div className="mb-4">
            <AccountNotActiveAlert status={accountNotActiveStatus} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Contraseña</Label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-slate-50">
            <Checkbox
              id="terms-login"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              disabled={isLoading}
              className="mt-1"
            />
            <label htmlFor="terms-login" className="text-sm cursor-pointer">
              Acepto los Términos y Condiciones de Urbex
            </label>
          </div>

          {error && !accountNotActiveStatus && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full bg-[#a738cd] hover:bg-[#8c2ca3]" disabled={isLoading || !acceptedTerms}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sesión
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <button
              onClick={onToggleForm}
              className="text-[#a738cd] hover:underline font-medium"
              type="button"
            >
              Regístrate aquí
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
