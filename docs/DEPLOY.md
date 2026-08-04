# Meridian — Guía de despliegue en Vercel

Todo el código está listo para producción; estos pasos requieren tus cuentas
(Vercel, Neon, Wompi) y por eso se hacen manualmente una sola vez.

## 1. Crear el proyecto en Vercel

1. Sube el repo a GitHub (si aún no está) y en [vercel.com/new](https://vercel.com/new) importa el repositorio.
2. Framework: Next.js (auto-detectado). No hace falta configuración de build especial.

## 2. Variables de entorno (Production)

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Cadena de conexión de Neon (usa la *pooled connection* si está disponible) |
| `AUTH_SECRET` | Genera uno nuevo para producción: `npx auth secret` (no reutilices el de dev) |
| `NEXT_PUBLIC_SITE_URL` | `https://<tu-dominio>` (sin barra final) — alimenta SEO, sitemap y retorno de la pasarela |
| `NEXT_PUBLIC_CURRENCY` / `NEXT_PUBLIC_LOCALE` | `COP` / `es-CO` (o los tuyos) |
| `PAYMENT_PROVIDER` | `bold` o `wompi`, según la pasarela elegida |
| `WOMPI_PUBLIC_KEY` / `WOMPI_INTEGRITY_SECRET` / `WOMPI_EVENTS_SECRET` | Solo con Wompi: del panel de Wompi (primero las `*_test_*` de sandbox; cambia a `*_prod_*` al salir en vivo) |
| `BOLD_API_KEY` / `BOLD_SECRET_KEY` | Solo con Bold: llave de identidad y llave secreta del panel de Bold → **Integraciones** → **Llaves de integración** (botón "Activar llaves" la primera vez; el panel muestra a la vez las de prueba y las de producción) |

Notas:
- `AUTH_TRUST_HOST` **no** hace falta en Vercel (se define sola).
- `PAYMENT_PROVIDER=mock` y `MOCK_WEBHOOK_SECRET` son solo para desarrollo local; **nunca** los pongas en producción.

## 3. Imágenes: Vercel Blob

1. En el dashboard del proyecto → **Storage** → **Create Database** → **Blob**.
2. Conéctalo al proyecto: Vercel inyecta `BLOB_READ_WRITE_TOKEN` automáticamente.
3. `src/lib/storage.ts` detecta el token y sube a Blob sin cambios de código. Sin token (dev) sigue guardando en `public/uploads/`.

> Las imágenes ya subidas en dev (`public/uploads/`, ignorado por git) no viajan al deploy: re-súbelas desde el admin en producción.

## 4. Base de datos

Con `DATABASE_URL` de producción exportada localmente:

```bash
npm run db:migrate     # aplica 0000 + 0001
ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD='UnaClaveFuerte' npm run db:seed
```

⚠️ No dejes la contraseña por defecto (`admin1234`) en producción.

## 5. Webhook de la pasarela

### Wompi

En el panel de Wompi → Configuración → **URL de eventos**:

```
https://<tu-dominio>/api/webhooks/wompi
```

### Bold

En el [Panel de Comercios de Bold](https://bold.co) → **Integraciones** →
**Webhooks** → **Configurar webhook**, pega en "URL de punto de conexión":

```
https://meridian-khaki-tau.vercel.app/api/webhooks/bold
```

y confirma con **Crear webhook**. (Cuando tengas dominio propio, registra la
URL con ese dominio; Bold admite hasta 5 endpoints.)

Notas de Bold:

- Bold exige HTTPS y respuesta `200` en menos de 2 segundos; si falla,
  reintenta hasta 5 veces (15 min → 24 h). El endpoint ya cumple: verifica la
  firma `x-bold-signature` (HMAC-SHA256 del cuerpo en Base64 con la llave
  secreta) y es idempotente (un pedido pagado no se revierte por webhooks
  duplicados o tardíos).
- **Sandbox:** las llaves de prueba de Bold no tienen un prefijo que las
  distinga de las de producción, y Bold firma los webhooks de transacciones
  de prueba con una llave secreta **vacía**. Por eso el modo se declara
  aparte: con `BOLD_SANDBOX="true"` el código verifica la firma con `""` en
  vez de `BOLD_SECRET_KEY`. Quita esa variable (o ponla en `"false"`) al
  pasar a producción — de lo contrario cualquiera podría forjar webhooks
  firmando con la llave vacía.
- `npm run test:bold` valida el algoritmo de ambas firmas con los ejemplos de
  la documentación oficial.

Haz una compra de prueba en sandbox (landing en modo "Pago online") y verifica
que el pedido pasa a **Pagado** en `/admin/orders` (cierre de la Etapa 6).

## 6. Dominio

1. Vercel → Settings → Domains → agrega tu dominio y configura el DNS.
2. Actualiza `NEXT_PUBLIC_SITE_URL` al dominio final y redeploya.

## 7. Checklist post-deploy

- [ ] `/` y `/:slug` de una landing publicada cargan con HTTPS.
- [ ] `robots.txt` bloquea `/admin`, `/api`, `/login`; `sitemap.xml` lista las landings publicadas.
- [ ] Headers presentes (CSP, nosniff, referrer-policy) — `curl -I https://<dominio>`.
- [ ] Login admin funciona y `/admin` redirige sin sesión.
- [ ] Subida de imagen desde el admin termina en `*.blob.vercel-storage.com`.
- [ ] Pedido COD de prueba llega al admin.
- [ ] Compra sandbox de la pasarela (Wompi o Bold) termina en "Pagado".
- [ ] Cambiar llaves de la pasarela a producción cuando el comercio esté
      aprobado (en Bold, además, retirar/poner en `"false"` `BOLD_SANDBOX`).

## Futuro documentado (no implementado)

- **Dominios personalizados por landing** (multi-dominio): Vercel permite apuntar varios dominios al proyecto; haría falta un campo `domain` en `landings` y resolver el slug por `Host` en `proxy.ts`. Se decidió posponerlo.
- **Notificaciones de pedido nuevo** (email / webhook a WhatsApp): pospuesto de la Etapa 5.
- **Rate-limit distribuido** (Upstash/Redis) si el proyecto escala a múltiples instancias: `src/lib/rate-limit.ts` mantiene la firma.
- **Analíticas propias** (vistas por landing y conversión): opcional de la Etapa 7.
