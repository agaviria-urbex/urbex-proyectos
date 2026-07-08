export type ProjectStatus = 'active' | 'draft' | 'archived';

export interface ProjectDefinition {
  id: string;
  empresa: string;
  empresaLabel: string;
  nombre: string;
  descripcion: string;
  url: string;
  status: ProjectStatus;
}

export const projects: ProjectDefinition[] = [
  {
    id: 'dashboard-matriculas-medellin-fase1',
    empresa: 'cimento',
    empresaLabel: 'Cimento',
    nombre: 'Dashboard Matrículas Medellín - Fase 1',
    descripcion:
      'Análisis interactivo de matrículas en Villa Carlota / Barrio Colombia, Medellín.',
    url: '/cimento/dashboard-matriculas-medellin-fase1',
    status: 'active',
  },
];

export function getProjectBySlug(empresa: string, proyecto: string) {
  return projects.find((p) => p.empresa === empresa && p.id === proyecto);
}
