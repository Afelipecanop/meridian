# Meridian — Plan del Proyecto

Plataforma de landing pages de producto único con editor visual tipo Shopify y panel de administración (productos y pedidos).

**Decisiones tomadas (2026-08-03):**
- Stack: **Next.js (App Router) + TypeScript**, migrando desde la plantilla Vite actual.
- Checkout: **dual** — cada landing elige entre contra entrega (COD) o pago online con pasarela.
- Infraestructura: **Vercel + Postgres gestionado** (Neon o Supabase, solo como BD).

**Estado actual (última actualización: 2026-08-03):**

| Etapa | Estado |
|-------|--------|
| 0 — Migración a Next.js | ✅ Completada |
| 1 — BD y autenticación | ✅ Completada |
| 2 — Admin + CRUD de productos | ✅ Completada |
| 3 — Secciones + landing pública | ⏭️ **Siguiente** (no iniciada) |
| 4 — Editor visual | ⏳ Pendiente |
| 5 — Checkout COD + pedidos | ⏳ Pendiente |
| 6 — Pasarela de pago | ⏳ Pendiente |
| 7 — Producción | ⏳ Pendiente |

---

## 1. Visión general

Tres áreas de la aplicación:

| Área | Ruta | Acceso | Descripción |
|------|------|--------|-------------|
| Landings públicas | `/:slug` | Público | Página única de producto, sin navegación de salida. Render en servidor (SSR/ISR) desde el JSON de secciones guardado en BD. |
| Editor visual | `/admin/landings/:id/editor` | Autenticado | Editor tipo Shopify: lista de secciones reordenables + panel de ajustes + vista previa en vivo. |
| Admin | `/admin/*` | Autenticado | Dashboard, productos (CRUD), pedidos, landings, ajustes. |

### Concepto clave: landing = JSON de secciones

Cada landing se guarda como un documento con una lista ordenada de secciones. Cada sección tiene un `type` (hero, beneficios, testimonios, galería, FAQ, formulario de pedido, HTML personalizado…) y un objeto `settings` propio. El frontend público tiene un **registro de secciones** (`type` → componente React) que renderiza el JSON. El editor edita ese mismo JSON. Agregar un tipo de sección nuevo = crear un componente + su esquema de ajustes; el resto del sistema no cambia.

---

## 2. Stack técnico

- **Framework:** Next.js 15+ (App Router, Server Components, Server Actions).
- **Lenguaje:** TypeScript estricto.
- **UI:** Tailwind CSS 4 + shadcn/ui (admin y editor). Ojo: la versión actual de shadcn/ui se basa en **Base UI**, no Radix — la composición usa la prop `render`, no `asChild`. Las landings usan estilos propios por sección + variables de tema por landing.
- **BD:** Postgres (Neon o Supabase) con **Drizzle ORM** (ligero, SQL-first, migraciones versionadas).
- **Auth:** Auth.js (NextAuth v5) con credenciales — un solo rol admin al inicio.
- **Validación:** Zod (esquemas compartidos entre editor, API y render).
- **Drag & drop del editor:** `@dnd-kit`.
- **Imágenes:** Vercel Blob (o Supabase Storage) para subir imágenes de productos/secciones.
- **Pagos:** capa `PaymentProvider` agnóstica; primera implementación con **Wompi o MercadoPago** (definir en Etapa 6), estructura lista para agregar Stripe.
- **Sanitización HTML personalizado:** `sanitize-html` en servidor antes de guardar/renderizar.

---

## 3. Modelo de datos

```
users            id, email, password_hash, name, created_at
products         id, name, description, price, compare_at_price, sku,
                 stock, images (json), active, created_at, updated_at
landings         id, slug (único), name, product_id → products,
                 status (draft|published), theme (json: colores, fuente),
                 seo (json: title, description, og_image),
                 checkout_mode (cod|gateway),
                 sections (json: [{ id, type, settings, visible }]),
                 published_sections (json)  ← copia al publicar (borrador vs publicado)
                 pixels (json: meta_pixel_id, tiktok_pixel_id, ga_id),
                 created_at, updated_at, published_at
orders           id, landing_id → landings, product_id → products,
                 customer (json: nombre, teléfono, email, dirección, ciudad, notas),
                 quantity, unit_price, total,
                 payment_method (cod|gateway),
                 payment_status (pending|paid|failed|n/a),
                 payment_ref (id transacción pasarela),
                 status (nuevo|confirmado|enviado|entregado|cancelado),
                 created_at, updated_at
order_events     id, order_id, type, data (json), created_at   ← historial de cambios
assets           id, url, filename, size, created_at            ← imágenes subidas
```

Notas:
- `sections` (borrador) vs `published_sections` (lo que ve el público) permite editar sin romper la landing en vivo, con botón **Publicar** como en Shopify.
- `customer` como JSON evita sobre-modelar; si luego se necesitan clientes recurrentes, se extrae a tabla propia.

---

## 4. Estructura de carpetas (objetivo)

```
src/
  app/
    (public)/
      [slug]/page.tsx          ← landing pública (SSR/ISR + generateMetadata)
    admin/
      layout.tsx               ← shell del admin (sidebar, auth guard)
      page.tsx                 ← dashboard
      products/                ← CRUD productos
      orders/                  ← lista + detalle de pedidos
      landings/
        page.tsx               ← lista de landings
        [id]/editor/page.tsx   ← editor visual
    api/
      checkout/route.ts        ← crear pedido (COD) / iniciar pago
      webhooks/[provider]/route.ts ← confirmación de pasarela
      upload/route.ts          ← subida de imágenes
    login/page.tsx
  components/
    sections/                  ← REGISTRO DE SECCIONES (render público)
      registry.ts              ← mapa type → { component, schema, defaults, label }
      hero.tsx, benefits.tsx, testimonials.tsx, gallery.tsx,
      faq.tsx, order-form.tsx, countdown.tsx, custom-html.tsx, ...
    editor/                    ← UI del editor (sidebar, panel ajustes, preview)
    admin/                     ← componentes del admin (tablas, formularios)
    ui/                        ← shadcn/ui
  db/
    schema.ts                  ← esquema Drizzle
    index.ts                   ← cliente
    migrations/
  lib/
    auth.ts, payments/ (provider.ts, wompi.ts, ...), sanitize.ts, zod-schemas/
```

---

## 5. Etapas del proyecto

### Etapa 0 — Migración a Next.js (base limpia)
**Objetivo:** reemplazar la plantilla Vite por un proyecto Next.js funcional en el mismo repo.
- [x] Crear proyecto Next.js con TypeScript, Tailwind, ESLint (App Router, `src/`).
- [x] Eliminar archivos de Vite (`vite.config.ts`, `index.html`, `src/App.tsx`, etc.).
- [x] Configurar shadcn/ui, fuentes y layout base.
- [x] Variables de entorno (`.env.example`): `DATABASE_URL`, `AUTH_SECRET`, etc.

**✅ Completada (2026-08-03).** Next.js 16.3 + React 19.2 + Tailwind 4.3 + shadcn/ui (estilo new-york, base neutral, fuente Geist). `npm run build` y `npm run lint` pasan; dev server verificado en localhost:3000.

**Criterio de éxito:** `npm run dev` levanta Next.js con página de inicio placeholder; `npm run build` pasa.

### Etapa 1 — Base de datos y autenticación
**Objetivo:** persistencia y acceso protegido al admin.
- [x] Crear BD Postgres en Neon/Supabase; conectar Drizzle. *(Neon, región sa-east-1; migración `0000` aplicada)*
- [x] Esquema inicial: `users`, `products`, `landings`, `orders`, `order_events`, `assets` + migraciones (generada `0000_organic_purifiers.sql`).
- [x] Auth.js (next-auth v5 beta) con credenciales; seed del admin en `scripts/seed.ts` (`npm run db:seed`, configurable con `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- [x] Protección de `/admin/*` vía `src/proxy.ts` (Next 16 usa proxy.ts en lugar de middleware.ts); página `/login` diseñada (estilo Modern Dark tipo Linear, con ui-ux-pro-max) + home rediseñada.

**Criterio de éxito:** login funciona; `/admin` inaccesible sin sesión; migraciones reproducibles.

**✅ Completada (2026-08-03).** Verificado end-to-end: `/admin` sin sesión redirige a `/login` (307), login con credenciales crea sesión JWT y `/admin` responde 200 autenticado. Admin seed: `admin@meridian.local` (cambiar contraseña con `ADMIN_PASSWORD=... npm run db:seed`).

### Etapa 2 — Admin: shell y CRUD de productos
**Objetivo:** panel navegable y gestión completa de productos.
- [x] Layout del admin: sidebar (Dashboard, Landings, Productos, Pedidos), header, responsive (sheet móvil).
- [x] Productos: lista con búsqueda/paginación, crear, editar, activar/desactivar, eliminar con confirmación.
- [x] Subida de imágenes con vista previa (`/api/upload` local en dev, abstraído en `src/lib/storage.ts` para Vercel Blob en Etapa 7).
- [x] Dashboard con contadores (productos, landings publicadas, pedidos nuevos) y CTA de primer producto.

**Criterio de éxito:** ciclo completo crear→editar→listar→eliminar producto con imágenes.

**✅ Completada (2026-08-03).** Verificado: build/lint en verde, las 5 rutas del admin responden 200 autenticadas, upload probado (201 con sesión / 401 sin sesión). Nota técnica: shadcn/ui ahora usa Base UI — la composición es con prop `render`, no `asChild`.

### Etapa 3 — Sistema de secciones y landing pública
**Objetivo:** que una landing guardada en BD se renderice pública, rápida y con SEO. (Aún sin editor: se crean landings de prueba por seed.)
- [ ] `registry.ts`: contrato de sección (componente, esquema Zod de settings, defaults, label e ícono para el editor).
- [ ] Secciones iniciales: **Hero, Beneficios, Galería, Testimonios, FAQ, Oferta/Precio, Countdown, Formulario de pedido, HTML personalizado**.
- [ ] Página `/:slug`: carga landing publicada, aplica tema (colores/fuente), renderiza `published_sections`, `generateMetadata` para SEO, ISR con revalidación al publicar.
- [ ] Sin navegación de salida: layout público sin header/footer con enlaces; solo contenido + CTA.
- [ ] Sanitización del HTML personalizado en servidor.
- [ ] Inyección de píxeles (Meta/TikTok/GA) desde `landings.pixels`.

**Criterio de éxito:** una landing seed se ve completa en `/:slug`, con meta tags correctos y Lighthouse razonable (>85 performance).

### Etapa 4 — Editor visual tipo Shopify
**Objetivo:** el corazón del proyecto — editar landings sin tocar código.
- [ ] Layout del editor: sidebar izquierda (lista de secciones, agregar/reordenar con dnd-kit, ocultar/eliminar), centro (preview iframe en vivo), panel derecho (ajustes de la sección seleccionada, generado desde su esquema Zod).
- [ ] Preview en vivo: iframe que renderiza el borrador con los mismos componentes públicos (postMessage o ruta `/preview/:id`); selector vista móvil/escritorio.
- [ ] Ajustes globales de landing: tema (colores, fuente), SEO, slug, píxeles, modo de checkout (COD/pasarela), producto asociado.
- [ ] Flujo borrador → **Publicar** (copia `sections` → `published_sections`, revalida ISR); indicador de cambios sin publicar.
- [ ] Sección HTML personalizado con editor de código (textarea + resaltado básico).
- [ ] Autosave del borrador (debounce) + guardado manual.
- [ ] CRUD de landings: crear desde plantilla base, duplicar, archivar.

**Criterio de éxito:** crear una landing desde cero en el editor, publicarla y verla en `/:slug` sin tocar código.

### Etapa 5 — Checkout COD y módulo de pedidos
**Objetivo:** vender. Formulario de pedido funcional y gestión de pedidos en admin.
- [ ] Sección "Formulario de pedido": campos configurables (nombre, teléfono, dirección, ciudad, cantidad, notas), textos y botón editables desde el editor.
- [ ] `POST /api/checkout`: valida con Zod, rate-limit básico, honeypot anti-spam, crea `order` (payment_method=cod, status=nuevo).
- [ ] Página/estado de gracias configurable (mensaje post-compra en la landing).
- [ ] Admin pedidos: lista con filtros (estado, landing, fecha), detalle, cambio de estado con historial (`order_events`), notas internas.
- [ ] Dashboard real: pedidos de hoy, por landing, tasa por estado.
- [ ] (Opcional) Notificación de pedido nuevo: email o webhook a WhatsApp propio.

**Criterio de éxito:** pedido creado desde una landing pública aparece en el admin y su estado se gestiona end-to-end.

### Etapa 6 — Pasarela de pago online
**Objetivo:** segundo modo de checkout, por landing.
- [ ] Definir pasarela inicial (Wompi / MercadoPago / Stripe según país y cuenta disponible).
- [ ] Interfaz `PaymentProvider` (`createCheckout`, `verifyWebhook`) + primera implementación.
- [ ] Flujo: pedido `pending` → redirección/widget de pago → webhook confirma → `paid` (+ evento). Manejo de fallo/abandono.
- [ ] En el editor: si la landing es modo pasarela, el formulario captura datos y redirige a pagar.
- [ ] Página de resultado de pago (éxito/error) dentro de la landing.

**Criterio de éxito:** compra de prueba en sandbox termina en pedido `paid` visible en admin.

### Etapa 7 — Producción y pulido
**Objetivo:** desplegar y endurecer.
- [ ] Despliegue en Vercel: envs de producción, dominio, `robots.txt` (bloquear `/admin`), sitemap de landings publicadas.
- [ ] Optimización de imágenes (`next/image` en secciones), fuentes con `next/font`.
- [ ] Revisión de seguridad: sanitización HTML, rate limits, headers (CSP básica), permisos de rutas API.
- [ ] Manejo de errores y 404 de landing no publicada.
- [ ] (Opcional) Analíticas propias: vistas por landing y conversión (vistas → pedidos).
- [ ] (Opcional) Dominios personalizados por landing (multi-dominio en Vercel) — dejar documentado, no implementar aún.

**Criterio de éxito:** plataforma en producción con una landing real vendiendo.

---

## 6. Orden y dependencias

```
E0 Migración ──► E1 BD+Auth ──► E2 Admin/Productos ──► E3 Secciones+Landing pública
                                                              │
                                                              ▼
                              E5 COD+Pedidos ◄── E4 Editor visual
                                     │
                                     ▼
                              E6 Pasarela ──► E7 Producción
```

Las etapas 0–3 son fundacionales y secuenciales. La 4 (editor) es la más larga (~la mitad del esfuerzo total del proyecto). La 5 puede empezar en paralelo a la 4 si el formulario de pedido se prueba con landings seed.

## 7. Riesgos y decisiones pendientes

- **Pasarela concreta** (Etapa 6): depende del país de operación y cuentas disponibles. La capa `PaymentProvider` aísla esta decisión.
- **HTML personalizado:** siempre sanitizar en servidor; documentar que no se permiten `<script>` arbitrarios (los píxeles van por el campo dedicado).
- **Preview del editor:** empezar con iframe + recarga por postMessage (simple y fiel); optimizar después si se siente lento.
- **Multi-usuario / roles:** fuera de alcance inicial; el esquema de `users` lo permite a futuro.
