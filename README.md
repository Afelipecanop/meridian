# Meridian

Plataforma de **landing pages de producto único** con editor visual tipo Shopify y panel de administración para productos, pedidos y páginas.

Cada landing es una página autónoma (`/:slug`) sin navegación de salida, pensada para tráfico de anuncios. Las landings se construyen como un JSON de secciones (hero, beneficios, testimonios, formulario de pedido, HTML personalizado…) que se edita visualmente y se renderiza en servidor.

> 📋 Plan por etapas: [`docs/PLAN.md`](docs/PLAN.md) · Informe: [`docs/INFORME.md`](docs/INFORME.md) · Despliegue: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Estado del proyecto

**Todas las etapas de código completadas (0–7)** — la plataforma vende end-to-end con pago contra entrega y pago online. Para ponerla en vivo solo falta ejecutar el despliegue: [`docs/DEPLOY.md`](docs/DEPLOY.md). Lo que funciona:

- 🔐 Login de admin con credenciales (Auth.js v5, sesión JWT) y protección de `/admin/*`
- 🖥️ Panel de administración oscuro (estética tipo Linear) con sidebar responsive
- 📦 CRUD completo de productos: búsqueda, paginación, imágenes con subida, activar/desactivar, eliminar
- 📊 Dashboard con contadores (productos, landings, pedidos)
- 🗄️ Base de datos Postgres (Neon) con el esquema completo de la plataforma
- 🧩 Sistema de secciones: 9 tipos (hero, beneficios, galería, testimonios, FAQ, oferta, countdown, formulario de pedido, HTML sanitizado) con esquemas Zod y registro extensible
- 🌐 Landing pública en `/:slug`: SSR + ISR, tema por landing, SEO (`generateMetadata`, OG/Twitter/canonical), píxeles Meta/TikTok/GA y 404 propio — pruébala con `npm run db:seed:landing` → `/botella-aurora`
- 🎨 Editor visual tipo Shopify (`/admin/landings/:id/editor`): secciones reordenables con drag & drop, panel de ajustes por sección, preview en vivo (escritorio/móvil), autosave y flujo borrador → **Publicar** con revalidación
- 🗂️ CRUD de landings: crear desde plantilla, duplicar, archivar/restaurar, eliminar
- 🛒 Checkout contra entrega: `POST /api/checkout` con validación Zod, rate-limit, honeypot anti-spam y precio calculado en servidor; mensaje de gracias configurable
- 📋 Módulo de pedidos: lista con filtros (estado, landing, fecha), detalle con cambio de estado, historial (`order_events`) y notas internas
- 📈 Dashboard con ventas de hoy, pedidos por estado y por landing
- 💳 Pago online por landing vía capa `PaymentProvider`: **Wompi** (checkout hosted + webhook verificado por firma) y proveedor `mock` para desarrollo; banner de resultado de pago en la landing *(pendiente: compra de prueba con llaves sandbox reales)*
- 🚀 Listo para producción: `next/image` en secciones, Vercel Blob para subidas, `robots.txt` + `sitemap.xml`, CSP y headers de seguridad, error boundary global

**Siguiente paso:** desplegar siguiendo [`docs/DEPLOY.md`](docs/DEPLOY.md).

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
| `AUTH_TRUST_HOST` | Solo `next start` fuera de Vercel | Ponla en `true` (Vercel la define sola) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL pública del sitio |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | — | Credenciales que usa `db:seed` |
| `NEXT_PUBLIC_CURRENCY` / `NEXT_PUBLIC_LOCALE` | — | Formato de precios (por defecto `COP` / `es-CO`) |
| `PAYMENT_PROVIDER` | Para pago online | `wompi` (por defecto si hay llaves) o `mock` (solo dev) |
| `WOMPI_PUBLIC_KEY` / `WOMPI_INTEGRITY_SECRET` / `WOMPI_EVENTS_SECRET` | Para Wompi | Llaves del panel de Wompi (sandbox: `pub_test_*`); registra `https://<dominio>/api/webhooks/wompi` como URL de eventos |

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
| `npm run db:seed:landing` | Crea/actualiza la landing demo publicada (`/botella-aurora`) |

## Estructura

```
src/
  app/
    page.tsx                 # Home pública
    (public)/[slug]/         # Landing pública (SSR/ISR + generateMetadata)
    not-found.tsx            # 404 (landing no publicada, rutas inexistentes)
    login/                   # Login del admin
    admin/
      (shell)/               # Panel con sidebar: dashboard, productos, pedidos, landings
      landings/[id]/editor/  # Editor visual fullscreen
      landings/[id]/preview/ # Render del borrador para el iframe del editor
    api/
      auth/[...nextauth]/    # Endpoints de Auth.js
      checkout/              # Crea pedidos (COD y pasarela) + estado de pago
      webhooks/[provider]/   # Confirmación de pago (Wompi/mock)
      upload/                # Subida de imágenes
  components/
    sections/                # Registro de secciones + componentes de render público
      registry.ts            # Mapa type → { componente, esquema Zod, defaults, label, ícono }
    editor/                  # Editor visual (shell, lista dnd, panel de ajustes, preview)
    admin/                   # Componentes del panel
    ui/                      # shadcn/ui
  db/
    schema.ts                # Esquema Drizzle (users, products, landings, orders…)
    migrations/
  lib/
    auth.ts, auth.config.ts  # Auth.js
    payments/                # Capa PaymentProvider (wompi.ts, mock.ts)
    landings.ts              # Consulta de landing publicada (memoizada)
    sanitize.ts              # Sanitización del HTML personalizado (sanitize-html)
    zod-schemas/sections.ts  # Esquemas de settings por tipo de sección
    storage.ts               # Almacenamiento de archivos (local en dev)
    format.ts                # Formato de moneda/fechas
  proxy.ts                   # Protección de /admin/* (Next 16)
scripts/
  seed.ts                    # Seed del usuario admin
  seed-landing.ts            # Seed de producto + landing demo publicada
docs/
  PLAN.md                    # Plan del proyecto por etapas
  INFORME.md                 # Informe de avance
```

## Rutas principales

- `/` — home pública
- `/login` — acceso al panel
- `/admin` — dashboard (requiere sesión)
- `/admin/products`, `/admin/landings`, `/admin/orders` — gestión
- `/admin/landings/:id/editor` — editor visual (fullscreen)
- `/:slug` — landings publicadas (p. ej. `/botella-aurora` tras el seed demo)

## Notas técnicas

- **Next 16 usa `proxy.ts`** (no `middleware.ts`): la protección de `/admin/*` vive en `src/proxy.ts`.
- **shadcn/ui se basa en Base UI** (no Radix): los componentes se componen con la prop `render`, no con `asChild`.
- **Imágenes**: en desarrollo se guardan en `public/uploads/` (ignorado por git); en producción, `src/lib/storage.ts` sube a Vercel Blob automáticamente cuando existe `BLOB_READ_WRITE_TOKEN`.
- **Precios** se guardan como `numeric(12,2)` en Postgres y se formatean con `Intl.NumberFormat` según `NEXT_PUBLIC_CURRENCY`/`NEXT_PUBLIC_LOCALE`.
- La documentación de esta versión de Next está en `node_modules/next/dist/docs/` — consúltala antes de asumir APIs de versiones anteriores.
