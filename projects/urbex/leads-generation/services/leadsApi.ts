import type { LeadsApiResponse, SearchPayload } from '../types';

export class LeadsApiService {
  static async searchLeads(
    email: string,
    payload: SearchPayload
  ): Promise<LeadsApiResponse> {
    const response = await fetch('/api/leads/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...payload }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        typeof data?.error === 'string'
          ? data.error
          : `Error en la API: ${response.status}`;
      throw new Error(message);
    }

    if (data?.success === false && data?.error) {
      throw new Error(String(data.error));
    }

    return data as LeadsApiResponse;
  }

  static buildPayload(searchData: {
    searchType: string;
    documentType?: string;
    documentNumber?: string;
    verificationCode?: string;
    phone?: string;
    email?: string;
    plate?: string;
  }): SearchPayload {
    switch (searchData.searchType) {
      case 'Por documento': {
        const payload: SearchPayload = {
          tipoDocumento: searchData.documentType!,
          numeroDocumento: searchData.documentNumber!,
        };
        if (searchData.verificationCode) {
          (payload as { codVerificacion?: string }).codVerificacion =
            searchData.verificationCode;
        }
        return payload;
      }
      case 'Por telefono':
        return { telefono: searchData.phone! };
      case 'Por email':
        return { searchEmail: searchData.email! };
      case 'Por placa':
        return { placa: searchData.plate! };
      default:
        throw new Error('Tipo de búsqueda no válido');
    }
  }
}
