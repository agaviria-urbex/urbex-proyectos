'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { register as registerUser, validatePassword } from '@/lib/auth';
import { Loader2, AlertCircle, CheckCircle2, Info, ExternalLink } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  confirmPassword: z.string(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  celular: z.string().min(10, 'El celular debe tener al menos 10 dígitos'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface InitialData {
  email?: string;
  nombre?: string;
  celular?: string;
}

interface RegisterFormProps {
  onToggleForm: () => void;
  onRegistrationSuccess: (email: string) => void;
  initialData?: InitialData;
  fromPayment?: boolean;
}

export function RegisterForm({ onToggleForm, onRegistrationSuccess, initialData, fromPayment }: RegisterFormProps) {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: initialData?.email || '',
      nombre: initialData?.nombre || '',
      celular: initialData?.celular || '',
    }
  });

  // Pre-llenar campos si vienen datos de pago
  useEffect(() => {
    if (initialData) {
      if (initialData.email) setValue('email', initialData.email);
      if (initialData.nombre) setValue('nombre', initialData.nombre);
      if (initialData.celular) setValue('celular', initialData.celular);
    }
  }, [initialData, setValue]);

  // Validar contraseña en tiempo real
  const password = watch('password');
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    if (pwd) {
      setPasswordValidation(validatePassword(pwd));
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones para continuar');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        celular: data.celular,
      });

      if (result.requiresConfirmation) {
        // Redirigir al componente de confirmación
        onRegistrationSuccess(data.email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTerms = () => {
    window.open('/terminos-condiciones-ejemplo.html', '_blank');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>
          Regístrate en Urbex para acceder a todas las funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Juan Pérez"
              {...register('nombre')}
              disabled={isLoading}
            />
            {errors.nombre && (
              <p className="text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

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
            <Label htmlFor="celular">Celular</Label>
            <Input
              id="celular"
              type="tel"
              placeholder="3001234567"
              {...register('celular')}
              disabled={isLoading}
            />
            {errors.celular && (
              <p className="text-sm text-red-600">{errors.celular.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Formato: 3001234567 (sin espacios ni guiones)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              onChange={handlePasswordChange}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
            
            {/* Indicador de requisitos de contraseña */}
            {password && (
              <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Requisitos de contraseña:
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
                    <span>Contraseña válida</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Checkbox de Términos y Condiciones */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Acepto los{' '}
                  <button
                    type="button"
                    onClick={handleOpenTerms}
                    className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Términos y Condiciones Contractuales
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  {' '}de Urbex
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Es obligatorio aceptar para crear tu cuenta
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Recibirás un código de verificación en tu email para activar tu cuenta.
            </AlertDescription>
          </Alert>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !acceptedTerms}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrarse
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <button 
              onClick={onToggleForm}
              className="text-primary hover:underline font-medium"
              type="button"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
