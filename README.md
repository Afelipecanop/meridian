# Meridian

Plataforma de **landing pages de producto único** con editor visual tipo Shopify y panel de administración para productos, pedidos y páginas.

Cada landing es una página autónoma (`/:slug`) sin navegación de salida, pensada para tráfico de anuncios. Las landings se construyen como un JSON de secciones (hero, beneficios, testimonios, formulario de pedido, HTML personalizado…) que se edita visualmente y se renderiza en servidor.

> 📋 Plan completo por etapas: [`docs/PLAN.md`](docs/PLAN.md) · Informe de avance: [`docs/INFORME.md`](docs/INFORME.md)

## Estado del proyecto

**Etapas 0–2 completadas** (de 8). Lo que ya funciona:

- 🔐 Login de admin con credenciales (Auth.js v5, sesión JWT) y protección de `/admin/*`
- 🖥️ Panel de administración oscuro (estética tipo Linear) con sidebar responsive
- 📦 CRUD completo de productos: búsqueda, paginación, imágenes con subida, activar/desactivar, eliminar
- 📊 Dashboard con contadores (productos, landings, pedidos)
- 🗄️ Base de datos Postgres (Neon) con el esquema completo de la plataforma

**Siguiente etapa:** sistema de secciones y render público de landings en `/:slug`.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, Server Components/Actions) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui + lucide-react |
| Base de datos | PostgreSQL (Neon) + Drizzle ORM |
| Autenticación | Auth.js (next-auth v5) con credenciales, sesión JWT |
| Validación | Zod |
| Despliegue previsto | Vercel |

## Puesta en marcha

Requisitos: Node.js 20+ y una base de datos Postgres (Neon o Supabase).

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
#    Copia .env.example a .env y completa DATABASE_URL y AUTH_SECRET
cp .env.example .env

# 3. Aplicar migraciones y crear el usuario admin
npm run db:migrate
npm run db:seed        # admin@meridian.local / admin1234 por defecto

# 4. Levantar el servidor
npm run dev            # http://localhost:3000
```

Para personalizar el usuario admin del seed:

```bash
ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD=TuClave ADMIN_NAME="Tu Nombre" npm run db:seed
```

### Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | Cadena de conexión Postgres (Neon/Supabase) |
| `AUTH_SECRET` | ✅ | Secreto de sesión (`npx auth secret`) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL pública del sitio |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | — | Credenciales que usa `db:seed` |
| `NEXT_PUBLIC_CURRENCY` / `NEXT_PUBLIC_LOCALE` | — | Formato de precios (por defecto `COP` / `es-CO`) |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera migraciones desde `src/db/schema.ts` |
| `npm run db:migrate` | Aplica migraciones a la BD |
| `npm run db:push` | Empuja el esquema sin migraciones (solo prototipos) |
| `npm run db:seed` | Crea/actualiza el usuario admin |

## Estructura

```
src/
  app/
    page.tsx                 # Home pública
    login/                   # Login del admin
    admin/                   # Panel de administración (protegido)
    api/
      auth/[...nextauth]/    # Endpoints de Auth.js
      upload/                # Subida de imágenes
  components/
    admin/                   # Componentes del panel
    ui/                      # shadcn/ui
  db/
    schema.ts                # Esquema Drizzle (users, products, landings, orders…)
    migrations/
  lib/
    auth.ts, auth.config.ts  # Auth.js
    storage.ts               # Almacenamiento de archivos (local en dev)
    format.ts                # Formato de moneda/fechas
  proxy.ts                   # Protección de /admin/* (Next 16)
scripts/
  seed.ts                    # Seed del usuario admin
docs/
  PLAN.md                    # Plan del proyecto por etapas
  INFORME.md                 # Informe de avance
```

## Rutas principales

- `/` — home pública
- `/login` — acceso al panel
- `/admin` — dashboard (requiere sesión)
- `/admin/products`, `/admin/landings`, `/admin/orders` — gestión
- `/:slug` — landings publicadas *(Etapa 3)*

## Notas técnicas

- **Next 16 usa `proxy.ts`** (no `middleware.ts`): la protección de `/admin/*` vive en `src/proxy.ts`.
- **shadcn/ui se basa en Base UI** (no Radix): los componentes se componen con la prop `render`, no con `asChild`.
- **Imágenes en desarrollo** se guardan en `public/uploads/` (ignorado por git); en producción se migrará a Vercel Blob manteniendo la firma de `src/lib/storage.ts`.
- **Precios** se guardan como `numeric(12,2)` en Postgres y se formatean con `Intl.NumberFormat` según `NEXT_PUBLIC_CURRENCY`/`NEXT_PUBLIC_LOCALE`.
- La documentación de esta versión de Next está en `node_modules/next/dist/docs/` — consúltala antes de asumir APIs de versiones anteriores.
