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

/**
 * Llama al proxy interno /api/proyectos (server-side),
 * que agrega URBEX_API_KEY sin exponerla en el browser.
 */
async function apiCall<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const res = await fetch('/api/proyectos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint, ...body }),
  });

  const data = await res.json();
  return data as ApiResponse<T>;
}

export async function fetchProyectos(email: string): Promise<ApiResponse<ProyectoCatalogo[]>> {
  return apiCall<ProyectoCatalogo[]>('/proyectos/listar', { email });
}

/**
 * Lista proyectos y, si la API aún no incluye grupos en /listar,
 * los completa con /proyectos/grupos/listar por cada proyecto.
 */
export async function fetchProyectosConGrupos(email: string): Promise<ApiResponse<ProyectoCatalogo[]>> {
  const res = await fetchProyectos(email);
  if (!res.success || !res.data) return res;

  const needsGrupos = res.data.some((p) => !Array.isArray(p.grupos));
  if (!needsGrupos) return res;

  const enriched = await Promise.all(
    res.data.map(async (proyecto) => {
      if (Array.isArray(proyecto.grupos)) return proyecto;
      try {
        const gruposRes = await listarGrupos(email, proyecto.id);
        return {
          ...proyecto,
          grupos: gruposRes.success && gruposRes.data ? gruposRes.data : [],
        };
      } catch {
        return { ...proyecto, grupos: [] };
      }
    })
  );

  return { ...res, data: enriched };
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
