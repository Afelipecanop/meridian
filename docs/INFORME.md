# Informe de Proyecto — Meridian

**Fecha:** 3 de agosto de 2026 (actualizado)
**Estado general:** Etapas 0, 1 y 2 completadas y verificadas · Etapa 3 **no iniciada** (siguiente)

---

## 1. Resumen ejecutivo

Meridian es una plataforma de landing pages de producto único con editor visual tipo Shopify y panel de administración (productos, pedidos, landings). El proyecto partió de una plantilla vacía de Vite y en esta fase se migró a Next.js, se montó la base de datos en la nube con su esquema completo, se implementó la autenticación del panel y se avanzó en el shell del admin. Todo lo entregado está verificado con build, lint y pruebas end-to-end del login.

## 2. Estado por etapas

| Etapa | Alcance | Estado |
|-------|---------|--------|
| 0 — Migración a Next.js | Base Next 16 + Tailwind 4 + shadcn/ui | ✅ Completada |
| 1 — BD y autenticación | Esquema Drizzle en Neon, Auth.js, login diseñado | ✅ Completada y verificada e2e |
| 2 — Admin + CRUD productos | Layout sidebar, productos, imágenes, dashboard | ✅ Completada y verificada |
| 3 — Secciones + landing pública | Registro de secciones, `/:slug` con SSR/SEO | ⏳ Pendiente |
| 4 — Editor visual | Editor tipo Shopify con preview en vivo | ⏳ Pendiente |
| 5 — Checkout COD + pedidos | Formulario de pedido y gestión en admin | ⏳ Pendiente |
| 6 — Pasarela de pago | Capa PaymentProvider (Wompi/MercadoPago/Stripe) | ⏳ Pendiente |
| 7 — Producción | Despliegue Vercel, seguridad, SEO técnico | ⏳ Pendiente |

### Detalle de la Etapa 2

- Tema oscuro del admin alineado a la identidad Meridian (índigo `#5E6AD2`, fondos `#050506`/`#0a0a0c`).
- 16 componentes shadcn/ui instalados (tabla, diálogos, dropdown, sheet, toasts…). Nota: shadcn/ui ahora se basa en **Base UI** (no Radix) — la composición usa la prop `render` en lugar de `asChild`.
- Layout del admin completo: sidebar de escritorio, menú móvil (sheet), header con menú de usuario y cierre de sesión.
- CRUD de productos completo: lista con búsqueda por nombre/SKU y paginación (10/página), formulario de crear/editar con precio, precio de comparación, stock, SKU, estado activo y galería de imágenes; activar/desactivar y eliminar con confirmación; toasts de feedback.
- API de subida de imágenes (`/api/upload`) autenticada, con validación de tipo y tamaño (5 MB), registrando en la tabla `assets`. Almacenamiento local en dev, abstraído para cambiar a Vercel Blob en producción.
- Dashboard con contadores reales (productos, landings publicadas, pedidos nuevos) y CTA de arranque; páginas stub para Landings y Pedidos.
- Verificación: las 5 rutas del admin responden 200 con sesión; upload responde 201 autenticado y 401 sin sesión.

## 2b. Métricas del código actual

| Métrica | Valor |
|---------|-------|
| Rutas | 11 (5 públicas/auth + 5 admin + 2 API: auth y upload) |
| Tablas en BD | 6 + 4 enums (migración `0000` aplicada) |
| Componentes shadcn/ui | 16 instalados |
| Versiones clave | Next 16.3 · React 19.2 · Tailwind 4.3 · next-auth 5.0.0-beta.32 · Drizzle 0.45 |
| Calidad | `npm run build` ✅ · `npm run lint` ✅ (0 warnings) |

## 3. Infraestructura y datos

- **Base de datos:** PostgreSQL en Neon (región `sa-east-1`), conectada vía Drizzle ORM.
- **Migración aplicada:** `0000_organic_purifiers.sql` — tablas `users`, `products`, `landings`, `orders`, `order_events`, `assets` + 4 enums de estado.
- **Usuario admin:** `admin@meridian.local` creado por seed. ⚠️ Contraseña por defecto pendiente de cambio.

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
| Contraseña admin por defecto | Seguridad | Cambiarla con `ADMIN_PASSWORD=... npm run db:seed` |
| next-auth en beta | Posibles breaking changes | Fijar versión exacta antes de producción |
| Pasarela de pago sin definir | Bloquea Etapa 6 | Decidir Wompi vs MercadoPago vs Stripe según país/cuenta |
| Uploads locales no sirven en Vercel | Bloquea producción | Migrar a Vercel Blob en Etapa 7 (ya abstraído) |
| Imágenes remotas en `next/image` | Menor | Configurar `remotePatterns` al pasar a Blob |

## 7. Próximos pasos

1. Etapa 3: registro de secciones y render público `/:slug` con SEO — el corazón de la propuesta de valor.
2. Etapa 4: editor visual (la etapa de mayor esfuerzo, ~50% del total restante).
3. Etapa 5: checkout contra entrega y módulo de pedidos.

---

*Informe generado automáticamente durante el desarrollo. Fuente de verdad del plan: [`PLAN.md`](PLAN.md).*
