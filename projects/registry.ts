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
  {
    id: 'leads-generation',
    empresa: 'urbex',
    empresaLabel: 'Urbex',
    nombre: 'Generador de leads',
    descripcion:
      'Informacion general de propiedades, vehiculos y de contacto a partir de identificacion, placa, email o telefonos',
    url: '/urbex/leads-generation',
    status: 'active',
  },
  {
    id: 'multiplaza',
    empresa: 'urbex',
    empresaLabel: 'Urbex',
    nombre: 'Dashboard Multiplaza',
    descripcion:
      'Dashboard de entendimiento demografico de los propietarios de los vehiculos que ingresan al centro comercial multiplaza en bogota',
    url: '/urbex/multiplaza',
    status: 'active',
  },
  {
    id: 'kia',
    empresa: 'urbex',
    empresaLabel: 'Urbex',
    nombre: 'Dashboard KIA',
    descripcion:
      'Dashboard de analisis de datos de perfilamiento de clientes de propietarios de placas de KIA y analisis de cambio de propietario de los vehiculos KIA',
    url: '/urbex/kia',
    status: 'active',
  },
];

export function getProjectBySlug(empresa: string, proyecto: string) {
  return projects.find((p) => p.empresa === empresa && p.id === proyecto);
}
