-- Catálogo del proyecto Dashboard KIA (solo @urbex).
-- Ejecutar en schema urbexapp. NO asignar grupos en proyectos_grupos_acceso.

INSERT INTO urbexapp.proyectos_catalogo
  (slug, empresa, empresa_label, nombre, descripcion, url, status)
VALUES
  (
    'kia',
    'urbex',
    'Urbex',
    'Dashboard KIA',
    'Dashboard de analisis de datos de perfilamiento de clientes de propietarios de placas de KIA y analisis de cambio de propietario de los vehiculos KIA',
    '/urbex/kia',
    'active'
  );

-- Verificación: no debe haber grupos asignados (solo @urbex ve el proyecto).
-- SELECT c.id, c.slug, g.grupo_cognito
-- FROM urbexapp.proyectos_catalogo c
-- LEFT JOIN urbexapp.proyectos_grupos_acceso g ON g.proyecto_id = c.id
-- WHERE c.slug = 'kia' AND c.empresa = 'urbex';
