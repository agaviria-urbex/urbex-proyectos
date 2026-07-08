import { projects } from '@/projects/registry';

/**
 * Verifica acceso al proyecto. Fase 1: cualquier usuario activo puede entrar.
 * Preparado para restricciones por empresa/grupo en fases futuras.
 */
export async function checkProjectAccess(
  _empresa: string,
  _proyecto: string
): Promise<boolean> {
  return true;
}

export function getProject(empresa: string, proyecto: string) {
  return projects.find(
    (p) => p.empresa === empresa && p.id === proyecto
  );
}
