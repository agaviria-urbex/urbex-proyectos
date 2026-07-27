# urbex-proyectos

Plataforma multi-proyecto de Urbex para aplicativos personalizados por empresa.

**URL producción:** `https://proyectos.urbex.com.co`

## Proyectos activos

| Empresa | Proyecto | URL |
|---------|----------|-----|
| Cimento | Dashboard Matrículas Medellín - Fase 1 | `/cimento/dashboard-matriculas-medellin-fase1` |
| Urbex (admin) | Consola de proyectos | `/consola` |

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

Abrir: `http://localhost:3000`

## Variables de entorno

Ver `.env.example`. Las variables críticas son:

- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` / `NEXT_PUBLIC_COGNITO_CLIENT_ID` — Auth AWS Cognito (mismo pool que urbex-app)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` — Mapa Mapbox
- `NEXT_PUBLIC_URBEX_API_URL` / `URBEX_API_KEY` — APIs Urbex (futuro)
- `NEXT_PUBLIC_SITE_URL` — URL pública (`https://proyectos.urbex.com.co`)

## Estructura

```
app/                    # Rutas Next.js (raíz del dominio)
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

La app se despliega con el `Dockerfile` (puerto **8080**) y la spec en [`.do/app.yaml`](.do/app.yaml).

### Opción A — Panel de DigitalOcean

1. Crear app en App Platform y conectar el repo `agaviria-urbex/urbex-proyectos` (branch `main`)
2. Elegir build con **Dockerfile** (`Dockerfile` en la raíz)
3. Puerto HTTP: `8080`; health check: `/api/health`
4. Configurar las variables de entorno en el panel (ver tabla abajo)
5. Añadir dominio `proyectos.urbex.com.co` y apuntar DNS (GoDaddy u otro) al app

### Opción B — doctl

```bash
doctl apps create --spec .do/app.yaml
```

Luego asigna los valores de las variables en el panel (los secretos no van en el YAML).

### Variables en App Platform

| Variable | Scope | Tipo |
|----------|-------|------|
| `NODE_ENV` | — | `production` (ya en YAML) |
| `NEXT_PUBLIC_URBEX_API_URL` | RUN_AND_BUILD_TIME | GENERAL |
| `URBEX_API_KEY` | RUN_TIME | SECRET |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | RUN_AND_BUILD_TIME | GENERAL |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | RUN_AND_BUILD_TIME | GENERAL |
| `NEXT_PUBLIC_COGNITO_REGION` | RUN_AND_BUILD_TIME | GENERAL |
| `AWS_ACCESS_KEY_ID` | RUN_TIME | SECRET (opcional) |
| `AWS_SECRET_ACCESS_KEY` | RUN_TIME | SECRET (opcional) |
| `AWS_REGION` | RUN_TIME | GENERAL |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | RUN_AND_BUILD_TIME | GENERAL |
| `NEXT_PUBLIC_SITE_URL` | RUN_AND_BUILD_TIME | GENERAL → `https://proyectos.urbex.com.co` |

Las `NEXT_PUBLIC_*` deben existir en **build time** (se inyectan en el bundle de Next.js).

### Verificación

```bash
curl https://proyectos.urbex.com.co/api/health
```

Respuesta esperada: JSON con `"status": "ok"`.

La app vive en la raíz del subdominio (sin prefijo `/proyectos`).

## Auth

- Login/registro con AWS Cognito (mismo User Pool que urbex-app-prod)
- Usuarios con `custom:accountStatus = active` pueden acceder
- Consola `/consola` requiere `custom:Group` que incluya `@urbex`

## GeoJSON

Los datos del dashboard Cimento se copian desde Dropbox con:

```bash
npm run copy-geojson
```

Ruta origen por defecto: `D:\Dropbox\Empresa\Urbex\Clientes\Cimento\Proyecto Matriculas Medellin - Julio 2026\GeoJSON`

Override: `GEOJSON_SOURCE=/ruta/custom npm run copy-geojson`
