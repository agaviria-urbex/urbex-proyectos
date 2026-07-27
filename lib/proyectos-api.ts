import { API_CONFIG } from './api-config';

const API_KEY = process.env.NEXT_PUBLIC_URBEX_API_KEY || process.env.URBEX_API_KEY || '';

export interface ProyectoCatalogo {
  id: number;
  slug: string;
  empresa: string;
  empresa_label: string;
  nombre: string;
  descripcion: string;
  url: string;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  grupos?: GrupoAcceso[];
}

export interface GrupoAcceso {
  id: number;
  grupo_cognito: string;
  created_at: string | null;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  grupo?: string;
  error?: string;
}

async function apiCall<T = unknown>(endpoint: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data as ApiResponse<T>;
}

export async function fetchProyectos(email: string): Promise<ApiResponse<ProyectoCatalogo[]>> {
  return apiCall<ProyectoCatalogo[]>('/proyectos/listar', { email });
}

export async function fetchProyectoDetalle(email: string, proyectoId: number): Promise<ApiResponse<ProyectoCatalogo>> {
  return apiCall<ProyectoCatalogo>('/proyectos/detalle', { email, proyecto_id: proyectoId });
}

export async function editarProyecto(
  email: string,
  proyectoId: number,
  campos: { nombre?: string; descripcion?: string }
): Promise<ApiResponse> {
  return apiCall('/proyectos/editar', { email, proyecto_id: proyectoId, ...campos });
}

export async function listarGrupos(email: string, proyectoId: number): Promise<ApiResponse<GrupoAcceso[]>> {
  return apiCall<GrupoAcceso[]>('/proyectos/grupos/listar', { email, proyecto_id: proyectoId });
}

export async function asignarGrupo(
  email: string,
  proyectoId: number,
  grupoCognito: string
): Promise<ApiResponse> {
  return apiCall('/proyectos/grupos/asignar', { email, proyecto_id: proyectoId, grupo_cognito: grupoCognito });
}

export async function eliminarGrupo(
  email: string,
  proyectoId: number,
  grupoCognito: string
): Promise<ApiResponse> {
  return apiCall('/proyectos/grupos/eliminar', { email, proyecto_id: proyectoId, grupo_cognito: grupoCognito });
}
