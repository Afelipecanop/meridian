
# Meridian — Plan del Proyecto

Plataforma de landing pages de producto único con editor visual tipo Shopify y panel de administración (productos y pedidos).

**Decisiones tomadas (2026-08-03):**
- Stack: **Next.js (App Router) + TypeScript**, migrando desde la plantilla Vite actual.
- Checkout: **dual** — cada landing puede ofrecer contra entrega (COD), pago online, o **ambos a la vez** dejando que el comprador elija en el formulario de pedido.
- Infraestructura: **Vercel + Postgres gestionado** (Neon o Supabase, solo como BD).
- Pasarela de pago activa en producción: **Bold** (Etapa 8). Wompi quedó implementado desde la Etapa 6 como alternativa dentro de la misma capa `PaymentProvider`, pero no es la que se usa en vivo.

**Estado actual (última actualización: 2026-08-04):**

| Etapa | Estado |
|-------|--------|
| 0 — Migración a Next.js | ✅ Completada |
| 1 — BD y autenticación | ✅ Completada |
| 2 — Admin + CRUD de productos | ✅ Completada |
| 3 — Secciones + landing pública | ✅ Completada |
| 4 — Editor visual | ✅ Completada |
| 5 — Checkout COD + pedidos | ✅ Completada |
| 6 — Pasarela de pago (Wompi) | ✅ Completada (implementada como alternativa; no es la activa en producción) |
| 7 — Producción | ✅ Completada — **desplegada en Vercel** (2026-08-04); checklist post-deploy en curso ([`DEPLOY.md`](DEPLOY.md)) |
| 8 — Bold, checkout dual y operación de pedidos | ✅ Completada (post-lanzamiento) |

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
- **Pagos:** capa `PaymentProvider` agnóstica; **Bold** es el proveedor activo en producción (Etapa 8: botón embebido + webhook HMAC), **Wompi** quedó implementado como alternativa (Etapa 6, checkout hosted), estructura lista para agregar más.
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
                 checkout_mode (cod|gateway|both) — enum propio "landing_checkout_mode",
                 sections (json: [{ id, type, settings, visible }]),
                 published_sections (json)  ← copia al publicar (borrador vs publicado)
                 pixels (json: meta_pixel_id, tiktok_pixel_id, ga_id),
                 created_at, updated_at, published_at
orders           id, landing_id → landings, product_id → products,
                 customer (json: nombres, apellidos, pais, telefono, email,
                           departamento, ciudad, direccion, notas),
                 quantity, unit_price, total,
                 payment_method (cod|gateway) — nunca "both": eso solo aplica a la landing,
                 payment_status (na|pending|paid|failed),
                 payment_ref (id transacción pasarela; también sirve para idempotencia del webhook),
                 status (nuevo|confirmado|en_preparacion|despachado|entregado|cancelado|devuelto),
                 created_at, updated_at
order_events     id, order_id, type, data (json: incluye "source" en eventos de pago:
                 checkout|webhook|admin), created_at   ← línea de tiempo del pedido
assets           id, url, filename, size, created_at            ← imágenes subidas
```

Notas:
- `sections` (borrador) vs `published_sections` (lo que ve el público) permite editar sin romper la landing en vivo, con botón **Publicar** como en Shopify.
- `customer` como JSON evita sobre-modelar; si luego se necesitan clientes recurrentes, se extrae a tabla propia.
- `checkout_mode` (landing) y `payment_method` (pedido) son **dos enums distintos** a propósito: la landing puede ofrecer "both", pero un pedido concreto siempre termina siendo `cod` o `gateway`, nunca "both".
- `status` (logística) y `payment_status` (dinero) son independientes: el estado del pedido siempre lo edita el admin; `payment_status` lo cambia el webhook de la pasarela (pedidos `gateway`) o el admin manualmente (solo pedidos `cod`, cuando el repartidor cobra).

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
- [x] `registry.ts`: contrato de sección (componente, esquema Zod de settings, defaults, label e ícono para el editor) en `src/components/sections/registry.ts`; esquemas compartidos en `src/lib/zod-schemas/sections.ts`.
- [x] Secciones iniciales: **Hero, Beneficios, Galería, Testimonios, FAQ, Oferta/Precio, Countdown, Formulario de pedido, HTML personalizado**. (El formulario captura datos y cantidad; el envío real llega con `POST /api/checkout` en la Etapa 5.)
- [x] Página `/:slug`: carga landing publicada (`src/lib/landings.ts`, memoizada con `cache`), aplica tema como CSS vars (`--lp-primary/bg/text`), renderiza `published_sections`, `generateMetadata` (title/description/OG/Twitter/canonical), ISR con `revalidate = 300` (revalidación on-demand al publicar llega con el editor en E4).
- [x] Sin navegación de salida: la landing solo tiene contenido + CTA y una línea legal; 404 propio (`src/app/not-found.tsx`) para slugs no publicados.
- [x] Sanitización del HTML personalizado en servidor (`sanitize-html` en `src/lib/sanitize.ts`; sin `<script>`/iframes).
- [x] Inyección de píxeles (Meta/TikTok/GA) desde `landings.pixels` (`src/components/sections/pixels.tsx` con `next/script`).

**Criterio de éxito:** una landing seed se ve completa en `/:slug`, con meta tags correctos y Lighthouse razonable (>85 performance).

**✅ Completada (2026-08-04).** Seed demo con `npm run db:seed:landing` (producto Botella Aurora + landing publicada `/botella-aurora` con las 9 secciones). Verificado sobre build de producción: `/botella-aurora` responde 200 con title/OG/Twitter/canonical correctos y todas las secciones renderizadas; slug inexistente responde 404. Lighthouse queda pendiente de medirse formalmente (página SSR estática con CSS inline y SVGs; imágenes pasan a `next/image` en Etapa 7).

### Etapa 4 — Editor visual tipo Shopify
**Objetivo:** el corazón del proyecto — editar landings sin tocar código.
- [x] Layout del editor: sidebar izquierda (lista de secciones, agregar/reordenar con dnd-kit, ocultar/eliminar), centro (preview iframe en vivo), panel derecho (ajustes de la sección seleccionada). Los formularios se definen declarativamente en `src/components/editor/field-defs.ts` (los esquemas Zod siguen validando en servidor). Ruta fullscreen fuera del shell del admin (grupo `(shell)` para el resto del panel).
- [x] Preview en vivo: iframe a `/admin/landings/:id/preview` que renderiza el borrador con los mismos componentes públicos; sincronización por `postMessage` (mismo origen); selector vista móvil/escritorio.
- [x] Ajustes globales de landing: tema (3 colores + fuente), SEO (título, descripción, OG), slug con validación y reservados, píxeles, modo de checkout, producto asociado.
- [x] Flujo borrador → **Publicar** (copia `sections` → `published_sections`, `revalidatePath` del slug actual y el anterior si cambió); **Despublicar**; indicador "cambios sin publicar" en topbar y en la lista.
- [x] Sección HTML personalizado con textarea monoespaciado (resaltado real queda como mejora futura).
- [x] Autosave del borrador (debounce 1.2 s) con estado visible (Guardando…/Guardado/Error).
- [x] CRUD de landings: crear desde plantilla base (7 secciones), duplicar (slug `-copia-n`, ids nuevos), archivar/restaurar (nuevo estado `archived`, migración `0001`), eliminar.

**Criterio de éxito:** crear una landing desde cero en el editor, publicarla y verla en `/:slug` sin tocar código.

**✅ Completada (2026-08-04).** Build/lint en verde. Verificado sobre build de producción con sesión real (login por cookies): `/admin/landings`, editor y preview responden 200 autenticados y 307 sin sesión; el preview server-renderiza las secciones del borrador; la landing pública sigue en 200. Nota: `next start` fuera de Vercel requiere `AUTH_TRUST_HOST=true` (documentado en `.env.example`). Pendiente de QA manual en navegador: drag & drop, autosave y publicación desde la UI (no automatizable por curl).

### Etapa 5 — Checkout COD y módulo de pedidos
**Objetivo:** vender. Formulario de pedido funcional y gestión de pedidos en admin.
- [x] Sección "Formulario de pedido": campos configurables (correo/notas opcionales), textos, botón y mensaje de gracias editables desde el editor; envío real a la API con total en vivo. Dentro del preview del editor el envío se simula (no crea pedidos).
- [x] `POST /api/checkout`: valida con Zod (esquema compartido en `src/lib/zod-schemas/checkout.ts`), rate-limit en memoria (5/min por IP, `src/lib/rate-limit.ts`), honeypot anti-spam (responde éxito falso sin crear pedido), precio calculado SIEMPRE en servidor, crea `order` (cod, nuevo) + evento `created`.
- [x] Estado de gracias configurable (`successTitle`/`successMessage`) mostrado en la landing tras el pedido.
- [x] Admin pedidos: lista con filtros (estado, landing, fecha: hoy/7d/30d/todo) y paginación; detalle con resumen, datos del cliente, cambio de estado con historial (`order_events`) y notas internas.
- [x] Dashboard real: pedidos de hoy con ventas, pedidos por estado (con barras) y por landing (con ingresos), enlazados a la lista filtrada.
- [ ] (Opcional, pospuesto) Notificación de pedido nuevo: email o webhook a WhatsApp propio.

**Criterio de éxito:** pedido creado desde una landing pública aparece en el admin y su estado se gestiona end-to-end.

**✅ Completada (2026-08-04).** Verificado sobre build de producción: pedido real por API → 201 y aparece en lista/detalle/dashboard del admin; honeypot devuelve éxito falso sin crear fila; validación 400 con mensaje; landing no publicada 404; sexta petición en un minuto 429; UTF-8 verificado (acentos correctos en BD y admin). El rate-limit es por instancia — al escalar horizontalmente cambiarlo por Upstash/Redis (misma firma). El cambio de estado desde la UI usa la misma server action verificada; QA manual del flujo en navegador pendiente junto al del editor.

### Etapa 6 — Pasarela de pago online
**Objetivo:** segundo modo de checkout, por landing.
- [x] Pasarela inicial: **Wompi** (la operación es Colombia: COP/es-CO; Stripe no opera para comercios locales). Cambiar a MercadoPago = implementar la misma interfaz.
- [x] Interfaz `PaymentProvider` (`createCheckout`, `verifyWebhook`) en `src/lib/payments/provider.ts` + implementación Wompi (Web Checkout hosted con firma de integridad; webhook con checksum de eventos) + proveedor **mock** para desarrollo (`PAYMENT_PROVIDER=mock`, webhook manual firmado).
- [x] Flujo completo: pedido `pending` → redirección al checkout → `POST /api/webhooks/[provider]` verifica firma y marca `paid`/`failed` (+ evento `payment`, idempotente: un pedido pagado no se revierte por webhooks tardíos). Fallo al iniciar el pago marca `failed` con evento.
- [x] El formulario de pedido en modo pasarela captura datos, crea el pedido y redirige a pagar (simulado dentro del preview del editor).
- [x] Resultado de pago dentro de la landing: banner cliente que lee `?pedido=` al volver de la pasarela y consulta `GET /api/checkout/status` (con polling mientras llega el webhook) — sin volver dinámica la página ISR. Fallo muestra "Reintentar" hacia el formulario.

**Criterio de éxito:** compra de prueba en sandbox termina en pedido `paid` visible en admin.

**✅ Completada (2026-08-04) con el sandbox real pendiente de llaves.** Verificado: (a) firmas Wompi con test unitario — la firma de integridad reproduce el ejemplo oficial de la documentación, checksum de webhook válido/alterado/DECLINED/evento-ignorado; (b) flujo e2e completo con el proveedor mock sobre build de producción: checkout 201 con `redirectUrl`, estado `pending`, webhook mal firmado 400, webhook APPROVED → `paid` visible en lista y detalle del admin (badge "Pagado", ref y evento en historial), webhook tardío idempotente, proveedor desconocido 404. **Para cerrar con Wompi real:** poner `WOMPI_PUBLIC_KEY/INTEGRITY_SECRET/EVENTS_SECRET` (sandbox) en `.env`, registrar la URL de eventos `https://<dominio>/api/webhooks/wompi` en el panel de Wompi y hacer una compra de prueba.

### Etapa 7 — Producción y pulido
**Objetivo:** desplegar y endurecer.
- [x] Preparación de despliegue en Vercel: guía paso a paso en [`DEPLOY.md`](DEPLOY.md) (envs, dominio, Blob, webhook Wompi, checklist post-deploy); `robots.txt` bloquea `/admin`, `/api` y `/login`; `sitemap.xml` con landings publicadas (revalida cada hora). **Despliegue ejecutado por el propietario el 2026-08-04 (Vercel + envs de producción).**
- [x] Optimización de imágenes: `next/image` en hero y galería (`fill` + `sizes`, `priority` en hero), `remotePatterns` https, SVG con sandbox; fuentes ya iban con `next/font` (Geist).
- [x] Almacenamiento de producción: `src/lib/storage.ts` usa **Vercel Blob** cuando existe `BLOB_READ_WRITE_TOKEN` (local en dev, misma firma).
- [x] Seguridad: headers en producción (CSP básica que solo permite scripts propios y de los píxeles soportados, `frame-ancestors 'self'` conservando el preview del editor, nosniff, referrer-policy, permissions-policy); sanitización HTML y rate-limits ya venían de E3/E5; rutas API de admin re-validan sesión.
- [x] Manejo de errores: error boundary global (`src/app/error.tsx`) + 404 propio (ya existía de E3).
- [ ] (Opcional, pospuesto) Analíticas propias: vistas por landing y conversión.
- [ ] (Opcional, documentado en DEPLOY.md, no implementado) Dominios personalizados por landing.

**Criterio de éxito:** plataforma en producción con una landing real vendiendo.

**✅ Completada (2026-08-04) — desplegada en producción.** Smoke test previo sobre build de producción local: headers CSP/nosniff/referrer/permissions presentes; `robots.txt` y `sitemap.xml` correctos (sitemap incluye `/botella-aurora`); la landing renderiza con `next/image` (`/_next/image` responde 200); admin, editor y checkout operativos bajo la CSP. El propietario ejecutó el despliegue en Vercel con las envs de producción (misma BD de Neon, migraciones ya aplicadas); el usuario admin de producción está creado y el admin de desarrollo por defecto fue eliminado. Queda el checklist post-deploy de `DEPLOY.md` (compra sandbox de Wompi, Blob, QA en navegador) para dar el criterio de éxito por cerrado con una landing vendiendo en vivo.

### Etapa 8 — Bold, checkout dual y operación de pedidos (post-lanzamiento)
**Objetivo:** con la plataforma ya en producción, poner en marcha la pasarela de pago real (Bold), enriquecer el formulario de pedido con datos reales de Colombia, permitir que una landing ofrezca contra entrega y pago online a la vez, y separar con claridad en el admin el estado del pedido (logística) del estado del pago (dinero).

- [x] **Pasarela Bold** (`src/lib/payments/bold.ts`): botón de pagos embebido (`checkout.bold.co/library/boldPaymentButton.js`) con firma de integridad SHA-256(`orderId+monto+moneda+llaveSecreta`); webhook verificado con HMAC-SHA256 sobre el cuerpo crudo en Base64 (comparación en tiempo constante), normaliza `SALE_APPROVED`/`SALE_REJECTED` a `paid`/`failed` y los `VOID_*` a ignorado. Modo sandbox explícito (`BOLD_SANDBOX="true"`, porque Bold firma las pruebas con llave vacía) para no aceptar esa llave vacía por accidente en producción. Test de firmas contra los ejemplos oficiales de la documentación (`npm run test:bold`).
- [x] **Idempotencia del webhook reforzada:** además de "pedido ya pagado no se revierte", ahora también se descarta cualquier evento cuyo `payment_id` ya quedó como `payment_ref` del pedido (webhooks duplicados o tardíos no reprocesan ni insertan eventos repetidos).
- [x] **Formulario de pedido rediseñado** (`src/components/sections/order-form.tsx`): nombres y apellidos separados, teléfono con selector de país (bandera + indicativo, Colombia +57 por defecto — `src/lib/countries.ts`), departamento → ciudad dependientes con datos reales de Colombia (`src/lib/colombia-geo.ts`, 33 departamentos y ciudades principales), dirección con complementos, validación en línea campo a campo con el mismo esquema Zod del servidor.
- [x] **`orders.customer` en español:** `nombres, apellidos, pais, telefono, departamento, ciudad, direccion, notas` (antes en inglés); sin migración de columna, sigue siendo `jsonb`.
- [x] **Checkout dual real:** `landings.checkout_mode` ganó el valor `both` (migración `0002`, enum propio `landing_checkout_mode`, separado del `payment_method` de los pedidos que sigue siendo estrictamente `cod|gateway`). Con `both` el formulario muestra un selector "Pago contra entrega" / "Pago anticipado"; el servidor decide el método real y nunca confía en lo que mande el cliente cuando la landing no está en `both`.
- [x] **Estado de pedido más operativo** (migración `0003`): `nuevo|confirmado|en_preparacion|despachado|entregado|cancelado|devuelto` (antes `enviado` en vez de `despachado`, sin `en_preparacion` ni `devuelto`). El dashboard excluye `cancelado` y `devuelto` de ventas e ingresos (antes solo excluía `cancelado`).
- [x] **Estado de pedido vs. estado de pago separados en el admin:** el estado del pedido siempre es editable (select + diálogo de confirmación, historial en `order_events`); el estado de pago es de solo lectura cuando el método es pasarela (lo cambia únicamente el webhook) y editable solo para contra entrega vía botón "Marcar pagado" con confirmación — la única otra vía, además del webhook, para tocar `payment_status`, y bloqueada a nivel de servidor para pedidos de pasarela.
- [x] **Línea de tiempo del pedido:** cada evento de pago incluye ahora su origen (`checkout`/`webhook`/`admin`) y se muestra en el historial cronológico junto con los cambios de estado.
- [x] **Filtros de `/admin/orders`:** estado de pedido y estado de pago ahora se filtran por separado (antes solo existía el filtro de estado de pedido).
- [x] **Incidente de producción resuelto:** tras el despliegue, cambiar el estado de un pedido fallaba en silencio porque las migraciones `0002`/`0003` no se habían corrido contra la base de datos de producción (Vercel despliega código, no migra la BD). Se endureció `updateOrderStatus`/`markOrderPaid` con manejo de errores explícito (el toast ahora muestra el error real de Postgres en vez de fallar sin explicación) y se documentó en `DEPLOY.md` que cada cambio de esquema requiere volver a correr `npm run db:migrate` contra producción.

**Criterio de éxito:** una landing en modo "ambos" deja elegir la forma de pago; un pedido de pasarela se confirma solo vía webhook; un pedido COD se gestiona a mano de principio a fin (estado y pago); y el estado de cualquier pedido es siempre editable desde el admin en producción.

**✅ Completada (2026-08-04).** Verificado con `tsc`/`eslint`/`next build` en verde tras cada cambio, más pruebas funcionales directas contra la base de datos real: webhook de Bold en sandbox (firma válida, reenvío duplicado y evento tardío contrario no revierten el pago), ciclo completo de un pedido COD (`nuevo→confirmado→en_preparación→despachado→entregado` + marcar pagado, con no-ops correctos al repetir), y validación de departamento/ciudad/forma de pago en `/api/checkout`. Probado también directamente en producción por el propietario, donde se detectó y corrigió el problema de migraciones pendientes descrito arriba.

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
