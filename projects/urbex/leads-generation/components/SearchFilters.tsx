'use client';

import { useState, type FormEvent } from 'react';
import { LeadsApiService } from '../services/leadsApi';
import type { LeadsApiResponse } from '../types';
import { ResultsDisplay } from './ResultsDisplay';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react';

type SearchType = 'Por documento' | 'Por telefono' | 'Por email' | 'Por placa';
type DocumentType = 'CC' | 'NIT' | 'CE' | 'PA' | 'TI';

interface FormData {
  searchType: SearchType;
  documentType: DocumentType;
  documentNumber: string;
  verificationCode: string;
  phone: string;
  email: string;
  plate: string;
}

interface SearchFiltersProps {
  userEmail: string;
}

const SEARCH_TYPES: SearchType[] = [
  'Por documento',
  'Por telefono',
  'Por email',
  'Por placa',
];
const DOCUMENT_TYPES: DocumentType[] = ['CC', 'NIT', 'CE', 'PA', 'TI'];

const INITIAL_FORM: FormData = {
  searchType: 'Por documento',
  documentType: 'CC',
  documentNumber: '',
  verificationCode: '',
  phone: '',
  email: '',
  plate: '',
};

export function SearchFilters({ userEmail }: SearchFiltersProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<LeadsApiResponse | null>(
    null
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (formData.searchType) {
      case 'Por documento':
        if (!formData.documentNumber.trim()) {
          newErrors.documentNumber = 'El número de documento es requerido';
        }
        if (formData.documentType === 'NIT' && !formData.verificationCode.trim()) {
          newErrors.verificationCode = 'El código de verificación es requerido';
        }
        break;
      case 'Por telefono':
        if (!formData.phone.trim()) {
          newErrors.phone = 'El número de teléfono es requerido';
        } else if (formData.phone.length < 7) {
          newErrors.phone = 'El teléfono debe tener al menos 7 dígitos';
        }
        break;
      case 'Por email':
        if (!formData.email.trim()) {
          newErrors.email = 'El email es requerido';
        } else if (!formData.email.includes('@')) {
          newErrors.email = 'El email debe contener @';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'El email no es válido';
        }
        break;
      case 'Por placa':
        if (!formData.plate.trim()) {
          newErrors.plate = 'La placa es requerida';
        } else if (formData.plate.length !== 6) {
          newErrors.plate = 'La placa debe tener exactamente 6 caracteres';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null);
    setSearchResults(null);

    try {
      const payload = LeadsApiService.buildPayload({
        searchType: formData.searchType,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        verificationCode: formData.verificationCode,
        phone: formData.phone,
        email: formData.email,
        plate: formData.plate,
      });
      const response = await LeadsApiService.searchLeads(userEmail, payload);
      setSearchResults(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al realizar la búsqueda';
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setApiError(null);
    setSearchResults(null);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-purple-800">
            Búsqueda de leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSearch}>
            <div className="space-y-2">
              <Label htmlFor="searchType">Forma de búsqueda</Label>
              <Select
                value={formData.searchType}
                onValueChange={(value) => {
                  setFormData({
                    ...INITIAL_FORM,
                    searchType: value as SearchType,
                  });
                  setErrors({});
                }}
              >
                <SelectTrigger id="searchType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEARCH_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.searchType === 'Por documento' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="documentType">Tipo de documento</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => {
                      const next = value as DocumentType;
                      setFormData({
                        ...formData,
                        documentType: next,
                        verificationCode:
                          next === 'NIT' ? formData.verificationCode : '',
                      });
                      if (next !== 'NIT' && errors.verificationCode) {
                        const { verificationCode: _removed, ...rest } = errors;
                        void _removed;
                        setErrors(rest);
                      }
                    }}
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">Número de documento</Label>
                  <Input
                    id="documentNumber"
                    value={formData.documentNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, documentNumber: e.target.value });
                      if (errors.documentNumber) {
                        setErrors({ ...errors, documentNumber: '' });
                      }
                    }}
                    placeholder="Ingrese el número de documento"
                    className={errors.documentNumber ? 'border-red-500' : ''}
                  />
                  {errors.documentNumber && (
                    <p className="text-xs text-red-600">{errors.documentNumber}</p>
                  )}
                </div>
                {formData.documentType === 'NIT' && (
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">
                      Código de verificación
                    </Label>
                    <Input
                      id="verificationCode"
                      value={formData.verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                        setFormData({ ...formData, verificationCode: value });
                        if (errors.verificationCode) {
                          setErrors({ ...errors, verificationCode: '' });
                        }
                      }}
                      placeholder="0-9"
                      maxLength={1}
                      inputMode="numeric"
                      className={errors.verificationCode ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500">
                      Dígito de verificación del NIT (1 número)
                    </p>
                    {errors.verificationCode && (
                      <p className="text-xs text-red-600">
                        {errors.verificationCode}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {formData.searchType === 'Por telefono' && (
              <div className="space-y-2">
                <Label htmlFor="phone">Número de teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone: value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="Ingrese el número de teléfono"
                  inputMode="numeric"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-xs text-red-600">{errors.phone}</p>
                )}
              </div>
            )}

            {formData.searchType === 'Por email' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="ejemplo@correo.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>
            )}

            {formData.searchType === 'Por placa' && (
              <div className="space-y-2">
                <Label htmlFor="plate">Placa</Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(e) => {
                    const value = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 6);
                    setFormData({ ...formData, plate: value });
                    if (errors.plate) setErrors({ ...errors, plate: '' });
                  }}
                  placeholder="ABC123"
                  maxLength={6}
                  className={`uppercase ${errors.plate ? 'border-red-500' : ''}`}
                />
                <p className="text-xs text-gray-500">
                  6 caracteres (letras y números)
                </p>
                {errors.plate && (
                  <p className="text-xs text-red-600">{errors.plate}</p>
                )}
              </div>
            )}

            {apiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {searchResults && !apiError && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Búsqueda completada</AlertTitle>
                <AlertDescription>
                  Resultados cargados exitosamente.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Resetear
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#a738cd] hover:bg-[#8c2ca3]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchResults && (
        <div className="mt-6">
          <ResultsDisplay results={searchResults} />
        </div>
      )}
    </>
  );
}
