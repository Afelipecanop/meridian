# Informe de Proyecto — Meridian

**Fecha:** 4 de agosto de 2026 (actualizado)
**Estado general:** Etapas 0–7 completas y **la plataforma está desplegada en producción** (Vercel con variables de entorno configuradas + Neon; deploy ejecutado por el propietario). El usuario admin de producción está creado y el admin de desarrollo por defecto fue eliminado de la BD. Pendientes del checklist post-deploy: **compra sandbox de Wompi** (registrar la URL de eventos en su panel), verificación del Blob store y QA en navegador.

---

## 1. Resumen ejecutivo

Meridian es una plataforma de landing pages de producto único con editor visual tipo Shopify y panel de administración (productos, pedidos, landings). El proyecto partió de una plantilla vacía de Vite y en esta fase se migró a Next.js, se montó la base de datos en la nube con su esquema completo, se implementó la autenticación del panel y se avanzó en el shell del admin. Todo lo entregado está verificado con build, lint y pruebas end-to-end del login.

## 2. Estado por etapas

| Etapa | Alcance | Estado |
|-------|---------|--------|
| 0 — Migración a Next.js | Base Next 16 + Tailwind 4 + shadcn/ui | ✅ Completada |
| 1 — BD y autenticación | Esquema Drizzle en Neon, Auth.js, login diseñado | ✅ Completada y verificada e2e |
| 2 — Admin + CRUD productos | Layout sidebar, productos, imágenes, dashboard | ✅ Completada y verificada |
| 3 — Secciones + landing pública | Registro de secciones, `/:slug` con SSR/SEO | ✅ Completada y verificada |
| 4 — Editor visual | Editor tipo Shopify con preview en vivo | ✅ Completada y verificada |
| 5 — Checkout COD + pedidos | Formulario de pedido y gestión en admin | ✅ Completada y verificada |
| 6 — Pasarela de pago | Capa PaymentProvider + Wompi + mock | ✅ Completada (sandbox real pendiente de llaves) |
| 7 — Producción | Despliegue Vercel, seguridad, SEO técnico | ✅ Completada — **desplegada en Vercel**; checklist post-deploy en curso (`DEPLOY.md`) |

### Detalle de la Etapa 2

- Tema oscuro del admin alineado a la identidad Meridian (índigo `#5E6AD2`, fondos `#050506`/`#0a0a0c`).
- 16 componentes shadcn/ui instalados (tabla, diálogos, dropdown, sheet, toasts…). Nota: shadcn/ui ahora se basa en **Base UI** (no Radix) — la composición usa la prop `render` en lugar de `asChild`.
- Layout del admin completo: sidebar de escritorio, menú móvil (sheet), header con menú de usuario y cierre de sesión.
- CRUD de productos completo: lista con búsqueda por nombre/SKU y paginación (10/página), formulario de crear/editar con precio, precio de comparación, stock, SKU, estado activo y galería de imágenes; activar/desactivar y eliminar con confirmación; toasts de feedback.
- API de subida de imágenes (`/api/upload`) autenticada, con validación de tipo y tamaño (5 MB), registrando en la tabla `assets`. Almacenamiento local en dev, abstraído para cambiar a Vercel Blob en producción.
- Dashboard con contadores reales (productos, landings publicadas, pedidos nuevos) y CTA de arranque; páginas stub para Landings y Pedidos.
- Verificación: las 5 rutas del admin responden 200 con sesión; upload responde 201 autenticado y 401 sin sesión.

### Detalle de la Etapa 3

- **Registro de secciones** (`src/components/sections/registry.ts`): contrato único `type → { componente, esquema Zod, defaults, label, ícono }`. Agregar un tipo nuevo = crear componente + esquema y registrarlo; el resto del sistema no cambia.
- **9 secciones implementadas:** Hero, Beneficios (11 íconos elegibles), Galería, Testimonios (con rating), FAQ (acordeón nativo `details`), Oferta/Precio (usa precio y precio de comparación del producto, calcula % de descuento), Countdown (client, sin desajustes de hidratación), Formulario de pedido (client; cantidad + total en vivo; el envío real llega con `POST /api/checkout` en la Etapa 5) y HTML personalizado.
- **Esquemas Zod compartidos** (`src/lib/zod-schemas/sections.ts`): todos los campos con `.default()`, de modo que `schema.parse({})` produce la configuración inicial — el editor de la Etapa 4 generará sus formularios desde aquí.
- **Página pública `/:slug`** (`src/app/(public)/[slug]/page.tsx`): consulta memoizada con `cache` (landing + producto en un join), tema por landing como CSS vars (`--lp-primary/bg/text` + fuente), `generateMetadata` (title, description, OG, Twitter, canonical), ISR con `revalidate = 300`, sin navegación de salida y 404 propio para slugs no publicados.
- **Sanitización en servidor** (`src/lib/sanitize.ts` con `sanitize-html`): sin `<script>` ni iframes; enlaces con `rel="noopener noreferrer"`. Los píxeles van solo por el campo dedicado.
- **Píxeles** (`src/components/sections/pixels.tsx`): Meta, TikTok y GA4 inyectados con `next/script` desde `landings.pixels`.
- **Seed demo** (`npm run db:seed:landing`): producto "Botella Térmica Aurora" (3 SVGs en `public/demo/`) + landing publicada `/botella-aurora` con las 9 secciones. Idempotente.
- Verificación sobre build de producción: `/botella-aurora` → 200 con meta tags correctos y todas las secciones; `/no-existe` → 404.

### Detalle de la Etapa 4

- **CRUD de landings** (`/admin/landings`): lista con estado (Borrador/Publicada/Archivada + "cambios sin publicar"), crear desde plantilla base de 7 secciones (diálogo con slug autogenerado), duplicar (slug `-copia-n`, ids de sección nuevos), archivar/restaurar (nuevo estado `archived`, migración `0001`) y eliminar con confirmación.
- **Editor visual** (`/admin/landings/:id/editor`): fullscreen (el resto del admin quedó bajo el grupo de rutas `(shell)` para que el editor no herede el sidebar). Tres paneles: lista de secciones reordenable con dnd-kit (ocultar/eliminar/agregar), preview central y panel de ajustes.
- **Panel de ajustes declarativo:** `field-defs.ts` describe los campos de cada tipo de sección (texto, textarea, código, boolean, número, select, imagen con upload, lista de imágenes, fecha-hora, listas de items plegables). Los ajustes globales cubren nombre, slug (validado + reservados), producto, modo de checkout, tema (colores + fuente), SEO y píxeles.
- **Preview en vivo:** iframe a `/admin/landings/:id/preview`, que renderiza el borrador con los mismos componentes públicos y se actualiza vía `postMessage` (verificando mismo origen) en cada cambio; toggle escritorio/móvil (375 px).
- **Autosave y publicación:** autosave con debounce de 1.2 s y estado visible; Publicar guarda el borrador, copia `sections` → `published_sections` y revalida `/:slug` (y el slug anterior si cambió); Despublicar vuelve a borrador. Todas las server actions re-validan sesión, slug y settings (Zod por tipo de sección).
- Verificación sobre build de producción con sesión real (cookies vía curl): editor/preview/lista 200 autenticados, 307 sin sesión; preview server-renderiza las secciones; `/botella-aurora` sigue 200. `AUTH_TRUST_HOST=true` requerido con `next start` fuera de Vercel (documentado). Pendiente: QA manual del drag & drop y publicación desde navegador.

### Detalle de la Etapa 5

- **`POST /api/checkout`:** esquema Zod compartido cliente/servidor; rate-limit en memoria (5/min por IP; cambiar a Upstash/Redis si se escala horizontalmente — misma firma en `src/lib/rate-limit.ts`); honeypot que responde éxito falso sin crear pedido (sin señal para el bot); valida landing publicada en modo COD y producto activo; el precio y el total se calculan **siempre en servidor**; crea el pedido + evento `created` en `order_events`.
- **Formulario de pedido real:** envía a la API con estado de carga, errores de validación en línea y mensaje de gracias configurable desde el editor (`successTitle`/`successMessage`); dentro del iframe del editor el envío se simula para no crear pedidos de prueba.
- **Módulo de pedidos en admin:** lista con filtros combinables (estado, landing, fecha hoy/7d/30d/todo) y paginación; detalle con resumen del pedido, tarjeta del cliente (teléfono clicable, dirección, notas), cambio de estado con select (historial automático en `order_events`) y notas internas.
- **Dashboard real:** pedidos de hoy con ventas del día, distribución por estado con barras y top de landings por pedidos e ingresos (excluyendo cancelados); cada métrica enlaza a la lista filtrada.
- Verificación e2e sobre build de producción: pedido 201 visible en admin; honeypot 201 falso sin fila nueva; payload inválido 400; landing inexistente 404; 6ª petición del minuto 429; acentos correctos (UTF-8) en BD y admin.

### Detalle de la Etapa 6

- **Pasarela elegida: Wompi.** La operación es Colombia (COP, es-CO) y Stripe no opera para comercios locales; MercadoPago queda a una clase de distancia gracias a la capa agnóstica.
- **Capa `PaymentProvider`** (`src/lib/payments/`): `createCheckout` (devuelve URL de redirección) y `verifyWebhook` (normaliza a `paid`/`failed`/ignorado). Implementaciones: **Wompi** (Web Checkout hosted con firma de integridad SHA-256; webhook `transaction.updated` verificado por checksum de eventos) y **mock** (`PAYMENT_PROVIDER=mock`, solo desarrollo: webhook manual firmado con `MOCK_WEBHOOK_SECRET`, deshabilitado si no está activo explícitamente).
- **Flujo:** checkout en modo pasarela crea el pedido con `payment_status=pending` y devuelve `redirectUrl`; el webhook verificado marca `paid`/`failed` con evento en el historial; idempotente (un pago aprobado no se revierte por webhooks tardíos). El precio se sigue calculando en servidor.
- **En la landing:** el formulario redirige al pago; al volver, un banner 100% cliente lee `?pedido=` y consulta `GET /api/checkout/status` con polling (~1 min) — éxito, pendiente o fallo con "Reintentar" — sin sacrificar el ISR de la página.
- **En el admin:** columna "Pago" en la lista (Contra entrega / Pendiente / Pagado / Fallido), método + referencia de transacción y eventos de pago en el detalle.
- Verificación: test unitario de firmas Wompi (la firma de integridad reproduce el ejemplo oficial de la doc; checksum válido/alterado/DECLINED/evento-ignorado) y e2e completo con mock sobre build de producción (9 casos: 201+redirect, pending, firma inválida 400, APPROVED→paid en admin, idempotencia, proveedor desconocido 404).
- **Pendiente para cerrar:** llaves sandbox de Wompi en `.env`, registrar `https://<dominio>/api/webhooks/wompi` como URL de eventos en su panel y hacer la compra de prueba.

### Detalle de la Etapa 7

- **SEO técnico:** `robots.txt` (bloquea `/admin`, `/api`, `/login`) y `sitemap.xml` con las landings publicadas, regenerado cada hora.
- **Imágenes:** hero y galería con `next/image` (`fill` + `sizes`, `priority` en el hero); `remotePatterns` https para URLs arbitrarias del editor; SVG servidos con sandbox; en producción las subidas van a **Vercel Blob** (`storage.ts` detecta `BLOB_READ_WRITE_TOKEN`, misma firma).
- **Seguridad:** headers solo en producción — CSP básica (scripts solo propios + dominios de píxeles; `frame-ancestors 'self'` mantiene el preview del editor; `form-action 'self'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. En dev no se aplican (el dev server necesita eval).
- **Errores:** error boundary global con botón de reintento; 404 propio ya existía.
- **Config:** `turbopack.root`/`outputFileTracingRoot` fijados (elimina los warnings por lockfiles fuera del repo).
- **Guía de despliegue** ([`DEPLOY.md`](DEPLOY.md)): Vercel paso a paso — envs de producción, Blob store, migraciones + seed con contraseña fuerte, URL de eventos de Wompi, dominio y checklist post-deploy. Documenta lo pospuesto: dominios personalizados por landing, notificaciones de pedido, rate-limit distribuido y analíticas propias.
- Verificación (build de producción local): headers presentes en las respuestas, robots/sitemap correctos, `/_next/image` optimizando (200), y admin + editor + checkout operativos bajo la CSP.

## 2b. Métricas del código actual

| Métrica | Valor |
|---------|-------|
| Rutas | 18 (6 públicas/auth + 8 admin + 5 API: auth, upload, checkout, checkout/status, webhooks/[provider]) |
| Migraciones | `0000` (esquema) + `0001` (estado `archived`) |
| Tablas en BD | 6 + 4 enums (migración `0000` aplicada) |
| Componentes shadcn/ui | 16 instalados |
| Versiones clave | Next 16.3 · React 19.2 · Tailwind 4.3 · next-auth 5.0.0-beta.32 · Drizzle 0.45 |
| Calidad | `npm run build` ✅ · `npm run lint` ✅ (0 warnings) |

## 3. Infraestructura y datos

- **Hosting:** Vercel, con las variables de entorno de producción configuradas por el propietario (deploy ejecutado el 2026-08-04).
- **Base de datos:** PostgreSQL en Neon (región `sa-east-1`), conectada vía Drizzle ORM. Es la misma instancia que usa Vercel en producción.
- **Migraciones aplicadas:** `0000_organic_purifiers.sql` (esquema completo: `users`, `products`, `landings`, `orders`, `order_events`, `assets` + 4 enums) y `0001_yummy_guardian.sql` (estado `archived`).
- **Usuario admin de producción:** `canos184@gmail.com`, creado con `npm run db:seed` y contraseña propia. El admin de desarrollo por defecto (`admin@meridian.local` / `admin1234`) fue **eliminado** de la BD por seguridad; se puede recrear para uso local con `npm run db:seed`.

## 4. Decisiones técnicas tomadas

1. **Next.js 16 con App Router** en lugar de Vite SPA: SSR/ISR para el SEO de las landings, API routes y Server Actions en un solo proyecto.
2. **`proxy.ts` en lugar de `middleware.ts`**: Next 16 renombró el archivo; la protección de `/admin/*` usa una config de auth ligera sin acceso a BD.
3. **next-auth v5 beta** funciona con Next 16 sin conflictos; sesión JWT (sin tabla de sesiones).
4. **Drizzle + postgres.js** con `prepare: false`: compatible a la vez con Neon y con PgBouncer de Supabase; decisión de BD portable.
5. **Estética "Modern Dark"** (tipo Linear) seleccionada con la skill ui-ux-pro-max: acento índigo, superficies glass, animaciones sutiles que respetan `prefers-reduced-motion`.
6. **Almacenamiento de imágenes abstraído** (`src/lib/storage.ts`): local en desarrollo, misma firma para Vercel Blob en la Etapa 7.
7. **Precios como `numeric(12,2)`** con formato `es-CO`/COP configurable por env (`NEXT_PUBLIC_CURRENCY`, `NEXT_PUBLIC_LOCALE`).

## 5. Verificaciones realizadas

- `npm run build` y `npm run lint` en verde tras cada etapa.
- Login end-to-end contra el servidor real: `/admin` sin sesión redirige (307) → login con credenciales crea sesión JWT → `/admin` responde 200 autenticado.
- Migraciones reproducibles desde cero (`db:generate` → `db:migrate` → `db:seed`).

## 6. Riesgos y pendientes de decisión

| Punto | Impacto | Acción prevista |
|-------|---------|-----------------|
| next-auth en beta | Posibles breaking changes | Versión fijada en `package.json`; revisar changelog antes de actualizar |
| Sandbox de Wompi sin probar | Cierre formal de Etapa 6 | Registrar `https://<dominio>/api/webhooks/wompi` en el panel de Wompi y hacer la compra de prueba |
| Dev y producción comparten la BD de Neon | Datos de prueba locales aparecen en producción | Crear un branch/BD separada de Neon para desarrollo cuando haya ventas reales |
| Subidas de imágenes en producción | Rotas sin Blob | Verificar que el store de Vercel Blob está conectado (`BLOB_READ_WRITE_TOKEN`) |

*Resueltos:* contraseña admin por defecto (usuario propio creado, default eliminado) y ejecución del despliegue (hecho el 2026-08-04).

## 7. Próximos pasos

1. Cerrar Etapa 6 con Wompi real: registrar la URL de eventos `https://<dominio>/api/webhooks/wompi` en el panel de Wompi y hacer la compra de prueba en sandbox.
2. Completar el checklist post-deploy de [`DEPLOY.md`](DEPLOY.md): headers, subida de imagen a Blob, pedido COD de prueba en producción.
3. QA manual en navegador: editor (drag & drop, autosave, publicar) y flujo de compra completo (COD y pasarela).
4. Medir Lighthouse de la landing en producción y ajustar si baja de 85 en performance.
5. Opcionales pospuestos: notificaciones de pedido, analíticas propias, dominios por landing.

---

*Informe generado automáticamente durante el desarrollo. Fuente de verdad del plan: [`PLAN.md`](PLAN.md).*
