-- Catálogo del proyecto Generador de leads (solo @urbex).
-- Ejecutar en schema urbexapp. NO asignar grupos en proyectos_grupos_acceso.

INSERT INTO urbexapp.proyectos_catalogo
  (slug, empresa, empresa_label, nombre, descripcion, url, status)
VALUES
  (
    'leads-generation',
    'urbex',
    'Urbex',
    'Generador de leads',
    'Informacion general de propiedades, vehiculos y de contacto a partir de identificacion, placa, email o telefonos',
    '/urbex/leads-generation',
    'active'
  );

-- Verificación: no debe haber grupos asignados (solo @urbex ve el proyecto).
-- SELECT c.id, c.slug, g.grupo_cognito
-- FROM urbexapp.proyectos_catalogo c
-- LEFT JOIN urbexapp.proyectos_grupos_acceso g ON g.proyecto_id = c.id
-- WHERE c.slug = 'leads-generation' AND c.empresa = 'urbex';
