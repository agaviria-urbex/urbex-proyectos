# urbex-proyectos

Plataforma multi-proyecto de Urbex para aplicativos personalizados por empresa.

**URL producción:** `https://www.urbex.com.co/proyectos`

## Proyectos activos

| Empresa | Proyecto | URL |
|---------|----------|-----|
| Cimento | Dashboard Matrículas Medellín - Fase 1 | `/proyectos/cimento/dashboard-matriculas-medellin-fase1` |
| Urbex (admin) | Consola de proyectos | `/proyectos/consola` |

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Copiar GeoJSON desde Dropbox (una vez)
npm run copy-geojson

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Cognito y Mapbox

# Iniciar servidor de desarrollo
npm run dev
```

Abrir: `http://localhost:3000/proyectos`

## Variables de entorno

Ver `.env.example`. Las variables críticas son:

- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` / `NEXT_PUBLIC_COGNITO_CLIENT_ID` — Auth AWS Cognito (mismo pool que urbex-app)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` — Mapa Mapbox
- `NEXT_PUBLIC_URBEX_API_URL` / `URBEX_API_KEY` — APIs Urbex (futuro)

## Estructura

```
app/                    # Rutas Next.js (basePath: /proyectos)
projects/               # Módulos por empresa/proyecto
  registry.ts           # Catálogo central de proyectos
  cimento/              # Proyectos de Cimento
public/data/            # GeoJSON y datos estáticos
lib/                    # Auth, utils, API config
```

## Agregar un nuevo proyecto

1. Crear módulo en `projects/{empresa}/{proyecto-id}/`
2. Registrar en `projects/registry.ts`
3. Agregar al mapa de módulos en `app/[empresa]/[proyecto]/ProjectPageClient.tsx`

## Despliegue (DigitalOcean App Platform)

1. Conectar repo `agaviria-urbex/urbex-proyectos` a App Platform
2. Usar el `Dockerfile` incluido
3. Configurar variables `NEXT_PUBLIC_*` en build time
4. Configurar DNS en GoDaddy:
   - Opción A: subdominio `proyectos.urbex.com.co` → app
   - Opción B: reverse proxy en `www.urbex.com.co/proyectos` → app

La app usa `basePath: '/proyectos'`, por lo que todas las rutas internas se resuelven bajo ese prefijo.

## Auth

- Login/registro con AWS Cognito (mismo User Pool que urbex-app-prod)
- Usuarios con `custom:accountStatus = active` pueden acceder
- Consola `/proyectos/consola` requiere `custom:Group` que incluya `@urbex`

## GeoJSON

Los datos del dashboard Cimento se copian desde Dropbox con:

```bash
npm run copy-geojson
```

Ruta origen por defecto: `D:\Dropbox\Empresa\Urbex\Clientes\Cimento\Proyecto Matriculas Medellin - Julio 2026\GeoJSON`

Override: `GEOJSON_SOURCE=/ruta/custom npm run copy-geojson`
