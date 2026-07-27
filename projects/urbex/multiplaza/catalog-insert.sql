-- Catálogo del proyecto Dashboard Multiplaza (solo @urbex).
-- Ejecutar en schema urbexapp. NO asignar grupos en proyectos_grupos_acceso.

INSERT INTO urbexapp.proyectos_catalogo
  (slug, empresa, empresa_label, nombre, descripcion, url, status)
VALUES
  (
    'multiplaza',
    'urbex',
    'Urbex',
    'Dashboard Multiplaza',
    'Dashboard de entendimiento demografico de los propietarios de los vehiculos que ingresan al centro comercial multiplaza en bogota',
    '/urbex/multiplaza',
    'active'
  );

-- Verificación: no debe haber grupos asignados (solo @urbex ve el proyecto).
-- SELECT c.id, c.slug, g.grupo_cognito
-- FROM urbexapp.proyectos_catalogo c
-- LEFT JOIN urbexapp.proyectos_grupos_acceso g ON g.proyecto_id = c.id
-- WHERE c.slug = 'multiplaza' AND c.empresa = 'urbex';
