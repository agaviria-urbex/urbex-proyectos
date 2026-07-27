'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccountNotActiveAlert } from '@/components/AccountNotActiveAlert';
import { login, AccountNotActiveError } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { AccountStatus } from '@/lib/amplify-config';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
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
    <Card className="w-full">
      <CardContent className="p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Bienvenido</h2>
          <p className="text-sm text-muted-foreground">
            Inicia sesión para acceder a Proyectos
          </p>
        </div>

        {accountNotActiveStatus && (
          <div className="mb-4">
            <AccountNotActiveAlert status={accountNotActiveStatus} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tucorreo@empresa.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
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
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms-login"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              disabled={isLoading}
              className="mt-1"
            />
            <label htmlFor="terms-login" className="cursor-pointer text-sm">
              Acepto los Términos y Condiciones de Urbex
            </label>
          </div>

          {error && !accountNotActiveStatus && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !acceptedTerms}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <button
              onClick={onToggleForm}
              className="font-medium text-primary hover:underline"
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
