import { fetchProyectos, type ProyectoCatalogo } from '@/lib/proyectos-api';

/**
 * Verifica si el usuario tiene acceso a un proyecto determinado.
 * Consulta la API que filtra por grupo de Cognito del usuario.
 * @urbex siempre tiene acceso a todos los proyectos.
 */
export async function checkProjectAccess(
  email: string,
  empresa: string,
  proyecto: string
): Promise<boolean> {
  try {
    const res = await fetchProyectos(email);
    if (!res.success || !res.data) return false;

    return res.data.some(
      (p: ProyectoCatalogo) => p.empresa === empresa && p.slug === proyecto
    );
  } catch {
    return false;
  }
}
