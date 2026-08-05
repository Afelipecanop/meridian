# Informe de Proyecto — Meridian

**Fecha:** 4 de agosto de 2026 (actualizado)
**Estado general:** Etapas 0–8 completas y **la plataforma está desplegada en producción** (Vercel con variables de entorno configuradas + Neon; deploy ejecutado por el propietario). El usuario admin de producción está creado y el admin de desarrollo por defecto fue eliminado de la BD. La pasarela activa en producción es **Bold** (Etapa 8, post-lanzamiento); Wompi quedó implementada desde la Etapa 6 como alternativa dentro de la misma capa `PaymentProvider`. **Pendiente crítico:** confirmar que las migraciones `0002` y `0003` (checkout dual y nuevo estado de pedido) quedaron aplicadas en la base de datos de **producción** — se detectó en pruebas reales que este paso manual se había omitido tras el primer deploy, lo que impedía cambiar el estado de los pedidos. Pendientes menores del checklist post-deploy: compra sandbox de Wompi (si se decide usarla en el futuro), verificación del Blob store y QA en navegador.

---

## 1. Resumen ejecutivo

Meridian es una plataforma de landing pages de producto único con editor visual tipo Shopify y panel de administración (productos, pedidos, landings). El proyecto partió de una plantilla vacía de Vite; se migró a Next.js, se montó la base de datos en la nube con su esquema completo, se implementó la autenticación del panel, el editor visual, el checkout (contra entrega y pasarela) y el módulo de pedidos, y se desplegó en producción (Vercel + Neon). La Etapa 8, post-lanzamiento, puso en marcha la pasarela real (Bold), amplió el formulario de pedido con datos de Colombia, habilitó que una landing ofrezca ambas formas de pago a la vez, y separó con claridad el estado del pedido del estado del pago en el admin. Todo lo entregado está verificado con build, lint y pruebas funcionales dirigidas contra la base de datos real.

## 2. Estado por etapas

| Etapa | Alcance | Estado |
|-------|---------|--------|
| 0 — Migración a Next.js | Base Next 16 + Tailwind 4 + shadcn/ui | ✅ Completada |
| 1 — BD y autenticación | Esquema Drizzle en Neon, Auth.js, login diseñado | ✅ Completada y verificada e2e |
| 2 — Admin + CRUD productos | Layout sidebar, productos, imágenes, dashboard | ✅ Completada y verificada |
| 3 — Secciones + landing pública | Registro de secciones, `/:slug` con SSR/SEO | ✅ Completada y verificada |
| 4 — Editor visual | Editor tipo Shopify con preview en vivo | ✅ Completada y verificada |
| 5 — Checkout COD + pedidos | Formulario de pedido y gestión en admin | ✅ Completada y verificada |
| 6 — Pasarela de pago | Capa PaymentProvider + Wompi + mock | ✅ Completada (implementada como alternativa; no es la activa en producción) |
| 7 — Producción | Despliegue Vercel, seguridad, SEO técnico | ✅ Completada — **desplegada en Vercel**; checklist post-deploy en curso (`DEPLOY.md`) |
| 8 — Bold, checkout dual y operación de pedidos | Pasarela Bold, formulario con datos de Colombia, checkout "ambos", estado de pedido/pago separados | ✅ Completada (post-lanzamiento) |

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

### Detalle de la Etapa 8 (post-lanzamiento)

- **Pasarela Bold** (`src/lib/payments/bold.ts`): botón de pagos embebido (`checkout.bold.co/library/boldPaymentButton.js`) con firma de integridad SHA-256(`orderId+monto+moneda+llaveSecreta`, monto sin decimales a diferencia de Wompi); webhook verificado con HMAC-SHA256 sobre el cuerpo crudo **en Base64** con comparación en tiempo constante, normaliza `SALE_APPROVED`/`SALE_REJECTED` a `paid`/`failed` y `VOID_*` a ignorado (200 sin reprocesar). Modo sandbox explícito con `BOLD_SANDBOX="true"` (Bold firma las transacciones de prueba con llave secreta vacía; sin el flag siempre se usa la llave real, para no dejar los webhooks de producción forjables). Idempotencia por `payment_id`: un pedido ya pagado, o un evento cuyo `payment_id` ya quedó como `payment_ref`, no se reprocesa. Firmas verificadas con un test que reproduce los ejemplos oficiales de la documentación de Bold (`npm run test:bold`).
- **Formulario de pedido rediseñado** (`src/components/sections/order-form.tsx`): nombres y apellidos como campos separados; teléfono con selector de país (bandera + indicativo, Colombia +57 por defecto, `src/lib/countries.ts` con 23 países); departamento → ciudad dependientes con datos reales de Colombia (`src/lib/colombia-geo.ts`, 33 departamentos con sus ciudades principales — no existía nada similar en el código); dirección con complementos; validación en línea campo a campo reusando el `checkoutSchema` de Zod compartido con el servidor (mensajes como "Ingrese un nombre válido" bajo cada input). `orders.customer` pasó a llaves en español (`nombres, apellidos, pais, telefono, departamento, ciudad, direccion, notas`) sin necesidad de migrar la columna (sigue siendo `jsonb`).
- **Checkout dual real (`both`):** `landings.checkout_mode` ganó un tercer valor (migración `0002_organic_colonel_america.sql`), respaldado por un enum propio `landing_checkout_mode` separado del `payment_method` de los pedidos (que se mantiene estrictamente `cod|gateway`, nunca `both`, evitando que un valor sin sentido llegue a un pedido real). Con `both`, el formulario muestra un selector "Pago contra entrega" / "Pago anticipado"; `resolvePaymentMethod()` en `/api/checkout` decide el método real en servidor y **ignora** cualquier elección del cliente cuando la landing no está en `both` (defensa en profundidad).
- **Estado de pedido más operativo** (migración `0003_jazzy_gateway.sql`): de `nuevo|confirmado|enviado|entregado|cancelado` a `nuevo|confirmado|en_preparacion|despachado|entregado|cancelado|devuelto`. La migración recrea el tipo enum (Postgres no permite quitar valores) y remapea los datos existentes de `enviado` a `despachado` en el mismo `USING` del `ALTER TABLE`, sin pérdida de información. El dashboard ahora excluye `cancelado` **y** `devuelto` de ventas e ingresos (antes solo `cancelado`).
- **Estado de pedido vs. estado de pago, separados en el admin:** el estado del pedido (`OrderStatusSelect`) siempre es editable, ahora con un diálogo de confirmación antes de aplicar el cambio; cada cambio sigue quedando en `order_events` con `from`/`to`. El estado de pago (`PaymentStatusControl`, componente nuevo) es de **solo lectura** cuando el pedido es de pasarela — con una nota explícita en la UI de que lo actualiza el webhook — y **editable únicamente para contra entrega**, con un botón "Marcar pagado" y su propia confirmación; la acción de servidor `markOrderPaid` rechaza explícitamente cualquier pedido que no sea `cod`.
- **Línea de tiempo del pedido:** la tarjeta "Historial" pasó a llamarse "Línea de tiempo"; todos los eventos de pago (creación del checkout, webhook, marcado manual) incluyen ahora un campo `source` (`checkout`/`webhook`/`admin`) que se muestra junto al evento, e íconos distintos según el tipo de evento.
- **Filtros de `/admin/orders`:** nuevo selector de estado de pago, independiente del selector de estado de pedido que ya existía (cada uno con su propio parámetro de URL).
- **Incidente de producción y su corrección:** tras el despliegue, el propietario reportó que no podía cambiar el estado de los pedidos. Diagnóstico: `docs/DEPLOY.md` documentaba correr `npm run db:migrate` solo para las migraciones `0000`+`0001`; las migraciones `0002`/`0003` de esta etapa nunca se corrieron contra la base de datos de **producción** (Vercel despliega código, no migra bases de datos), por lo que el enum `order_status` en producción seguía con los 5 valores viejos y cualquier intento de guardar un valor nuevo (`en_preparacion`, `despachado`, `devuelto`) era rechazado por Postgres. Como `updateOrderStatus`/`markOrderPaid` no capturaban ese error, la falla era silenciosa desde la UI. Se corrigió en dos frentes: (1) ambas acciones ahora envuelven la escritura en `try/catch` y devuelven el mensaje real de Postgres en el toast; (2) `DEPLOY.md` documenta explícitamente que cada migración nueva debe re-aplicarse contra producción a mano.
- Verificación: `tsc --noEmit`, `eslint` y `next build` en verde tras cada cambio. Pruebas funcionales directas contra la base de datos real (sin poder automatizar la UI autenticada, ya que el único usuario es la cuenta real del propietario): webhook de Bold en sandbox con firma válida → `paid`; reenvío del mismo evento y un evento tardío contrario con el mismo `payment_id` → ambos no-op, sin revertir el pago; ciclo completo de un pedido COD (`nuevo→confirmado→en_preparación→despachado→entregado`, con repetición de un mismo estado como no-op) + `markOrderPaid` (`na→paid`, repetirlo también no-op); validaciones negativas de `/api/checkout` (forma de pago no elegida en modo `both`, departamento inválido). El propietario probó el flujo completo directamente en producción, donde surgió y se resolvió el incidente de migraciones descrito arriba.

## 2b. Métricas del código actual

| Métrica | Valor |
|---------|-------|
| Rutas | 18 (6 públicas/auth + 8 admin + 5 API: auth, upload, checkout, checkout/status, webhooks/[provider]) |
| Migraciones | `0000` (esquema) + `0001` (estado `archived`) + `0002` (`landing_checkout_mode` con `both`) + `0003` (`order_status` con 7 valores) |
| Tablas en BD | 6 + 5 enums |
| Proveedores de pago | Bold (activo en producción), Wompi (alternativa), mock (desarrollo) |
| Componentes shadcn/ui | 16 instalados |
| Versiones clave | Next 16.3 · React 19.2 · Tailwind 4.3 · next-auth 5.0.0-beta.32 · Drizzle 0.45 |
| Calidad | `npm run build` ✅ · `npm run lint` ✅ (0 warnings) |

## 3. Infraestructura y datos

- **Hosting:** Vercel, con las variables de entorno de producción configuradas por el propietario (deploy ejecutado el 2026-08-04).
- **Base de datos:** PostgreSQL en Neon (región `sa-east-1`), conectada vía Drizzle ORM. Es la misma instancia que usa Vercel en producción.
- **Migraciones aplicadas (en la base de desarrollo/dev usada para verificar):** `0000_organic_purifiers.sql` (esquema completo: `users`, `products`, `landings`, `orders`, `order_events`, `assets` + enums iniciales), `0001_yummy_guardian.sql` (estado `archived`), `0002_organic_colonel_america.sql` (`landing_checkout_mode` con `cod|gateway|both`) y `0003_jazzy_gateway.sql` (`order_status` con los 7 valores operativos). **Pendiente de confirmar que `0002` y `0003` también quedaron aplicadas en la base de datos de producción** — ver el incidente descrito en el detalle de la Etapa 8.
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
| **Migraciones de esquema no re-aplicadas a producción tras un deploy** | Ya causó una falla real (no se podía cambiar el estado de un pedido) | `DEPLOY.md` documenta ahora que cada migración nueva debe correrse a mano contra producción; las acciones afectadas ya muestran el error real de Postgres si vuelve a pasar, en vez de fallar en silencio |
| next-auth en beta | Posibles breaking changes | Versión fijada en `package.json`; revisar changelog antes de actualizar |
| Sandbox de Wompi sin probar | Sin impacto en producción (Bold es la pasarela activa); solo relevante si se decide usar Wompi | Registrar `https://<dominio>/api/webhooks/wompi` en el panel de Wompi y hacer la compra de prueba, si llega a necesitarse |
| Dev y producción comparten la BD de Neon | Datos de prueba locales aparecen en producción | Crear un branch/BD separada de Neon para desarrollo cuando haya ventas reales |
| Subidas de imágenes en producción | Rotas sin Blob | Verificar que el store de Vercel Blob está conectado (`BLOB_READ_WRITE_TOKEN`) |

*Resueltos:* contraseña admin por defecto (usuario propio creado, default eliminado) y ejecución del despliegue (hecho el 2026-08-04).

## 7. Próximos pasos

1. **Confirmar en producción** que `npm run db:migrate` aplicó `0002` y `0003` (verificar que se puede cambiar el estado de un pedido a `en_preparacion`/`despachado`/`devuelto` sin error).
2. QA manual en navegador de lo nuevo de la Etapa 8: formulario con departamento/ciudad/país, selector de forma de pago en landings `both`, diálogo de confirmación al cambiar estado, botón "Marcar pagado" en pedidos COD.
3. Completar el checklist post-deploy de [`DEPLOY.md`](DEPLOY.md): headers, subida de imagen a Blob.
4. QA manual en navegador de lo ya reportado como completado: editor (drag & drop, autosave, publicar).
5. Medir Lighthouse de la landing en producción y ajustar si baja de 85 en performance.
6. Opcionales pospuestos: notificaciones de pedido, analíticas propias, dominios por landing, cierre formal de Wompi con sandbox real (si se decide usarla).

---

*Informe generado automáticamente durante el desarrollo. Fuente de verdad del plan: [`PLAN.md`](PLAN.md).*
