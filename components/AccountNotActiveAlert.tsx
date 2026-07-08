'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Phone, MessageCircle } from 'lucide-react';
import { AccountStatus, URBEX_CONTACT } from '@/lib/amplify-config';

interface AccountNotActiveAlertProps {
  status: AccountStatus;
}

export function AccountNotActiveAlert({ status }: AccountNotActiveAlertProps) {
  const isPending = status === AccountStatus.PENDING;
  const isDisabled = status === AccountStatus.DISABLED;

  const handleWhatsAppClick = () => {
    const whatsappUrl = `${URBEX_CONTACT.whatsappLink}?text=${encodeURIComponent(URBEX_CONTACT.message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = () => {
    window.location.href = `tel:${URBEX_CONTACT.phone}`;
  };

  return (
    <Alert variant="destructive" className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-800 dark:text-orange-200 text-lg font-semibold mb-2">
        {isPending && '⏳ Cuenta Pendiente de Aprobación'}
        {isDisabled && '🚫 Cuenta Desactivada'}
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300 space-y-4">
        <div>
          {isPending && (
            <p>
              Tu cuenta ha sido creada exitosamente, pero está <strong>pendiente de aprobación manual</strong> por nuestro equipo. 
              Una vez aprobada, podrás acceder a todas las funcionalidades de Urbex.
            </p>
          )}
          {isDisabled && (
            <p>
              Tu cuenta ha sido <strong>desactivada</strong>. Si crees que esto es un error o necesitas reactivar tu cuenta, 
              contacta a nuestro equipo comercial.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
            📞 Contacta a nuestro equipo comercial:
          </p>
          <div className="space-y-2">
            <p className="text-orange-800 dark:text-orange-200">
              <strong>{URBEX_CONTACT.name}</strong>
            </p>
            <p className="text-orange-700 dark:text-orange-300">
              Cel: <strong>{URBEX_CONTACT.phoneFormatted}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleWhatsAppClick}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Contactar por WhatsApp
          </Button>
          <Button
            onClick={handleCallClick}
            variant="outline"
            className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
          >
            <Phone className="mr-2 h-4 w-4" />
            Llamar Ahora
          </Button>
        </div>

        <p className="text-xs text-orange-600 dark:text-orange-400 italic">
          💡 <strong>Tip:</strong> {isPending ? 'La aprobación suele tomar menos de 24 horas hábiles.' : 'Nuestro equipo está disponible para ayudarte.'}
        </p>
      </AlertDescription>
    </Alert>
  );
}

