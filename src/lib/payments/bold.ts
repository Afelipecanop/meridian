import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  WebhookResult,
} from "./provider";

/**
 * Bold (Colombia) vía Botón de pagos embebido (https://developers.bold.co):
 * - createCheckout arma los atributos data-* del script
 *   https://checkout.bold.co/library/boldPaymentButton.js, incluida la firma
 *   de integridad SHA-256(`{orderId}{monto}{moneda}{llaveSecreta}`) en hex.
 *   El monto va SIN decimales (pesos completos, no centavos como Wompi).
 * - verifyWebhook valida el header `x-bold-signature`:
 *   HMAC-SHA256 en hex de base64(rawBody) con la llave secreta.
 *
 * Llaves (identidad + secreta): panel de Bold → Integraciones → Llaves de
 * integración. Las llaves de prueba no tienen prefijo distinguible, así que
 * el modo sandbox se declara con BOLD_SANDBOX="true": Bold firma los
 * webhooks de transacciones de prueba con llave VACÍA. Sin el flag se usa
 * siempre BOLD_SECRET_KEY (aceptar la llave vacía en producción haría los
 * webhooks forjables).
 */

const SCRIPT_URL = "https://checkout.bold.co/library/boldPaymentButton.js";

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

export function boldIntegritySignature(
  orderId: string,
  amount: string | number,
  currency: string,
  secretKey: string,
): string {
  return createHash("sha256")
    .update(`${orderId}${amount}${currency}${secretKey}`)
    .digest("hex");
}

export function boldWebhookSignature(
  rawBody: string,
  secretKey: string,
): string {
  return createHmac("sha256", secretKey)
    .update(Buffer.from(rawBody, "utf8").toString("base64"))
    .digest("hex");
}

/** Comparación en tiempo constante de dos firmas hex. */
function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected.toLowerCase(), "utf8");
  const b = Buffer.from(received.toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

type BoldEvent = {
  type?: string;
  data?: {
    payment_id?: string;
    metadata?: { reference?: string };
  };
};

export const boldProvider: PaymentProvider = {
  name: "bold",

  async createCheckout({
    order,
    redirectUrl,
  }: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const apiKey = env("BOLD_API_KEY");
    const secretKey = env("BOLD_SECRET_KEY");
    if (!apiKey || !secretKey) {
      return {
        ok: false,
        error: "Bold no está configurado (BOLD_API_KEY / BOLD_SECRET_KEY)",
      };
    }

    const currency = process.env.NEXT_PUBLIC_CURRENCY ?? "COP";
    // Bold exige el monto entero, sin decimales (COP no maneja centavos).
    const amount = String(Math.round(Number(order.total)));
    const reference = order.id;

    return {
      ok: true,
      embedded: {
        provider: "bold",
        scriptUrl: SCRIPT_URL,
        attributes: {
          "data-bold-button": "dark-L",
          "data-api-key": apiKey,
          "data-order-id": reference,
          "data-currency": currency,
          "data-amount": amount,
          "data-integrity-signature": boldIntegritySignature(
            reference,
            amount,
            currency,
            secretKey,
          ),
          "data-redirection-url": redirectUrl,
          "data-description": `Pedido ${reference.slice(0, 8)}`,
          // Modal en la misma página en lugar de navegar a Bold.
          "data-render-mode": "embedded",
          "data-customer-data": JSON.stringify({
            fullName: `${order.customer.nombres} ${order.customer.apellidos}`,
            phone: order.customer.telefono,
            ...(order.customer.email ? { email: order.customer.email } : {}),
          }),
        },
      },
    };
  },

  async verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<WebhookResult> {
    // Bold firma los webhooks de transacciones de prueba con llave VACÍA y
    // los de producción con la llave secreta. El modo se declara explícito
    // (BOLD_SANDBOX): inferirlo o "probar ambas" permitiría forjar webhooks
    // en producción firmando con la llave vacía.
    const secret =
      process.env.BOLD_SANDBOX === "true" ? "" : env("BOLD_SECRET_KEY");
    if (secret === undefined) {
      return { ok: false, error: "BOLD_SECRET_KEY no configurado" };
    }

    const received = headers.get("x-bold-signature");
    if (!received) {
      return { ok: false, error: "Falta el header x-bold-signature" };
    }
    if (!signaturesMatch(boldWebhookSignature(rawBody, secret), received)) {
      return { ok: false, error: "Firma inválida" };
    }

    let event: BoldEvent;
    try {
      event = JSON.parse(rawBody) as BoldEvent;
    } catch {
      return { ok: false, error: "Cuerpo inválido" };
    }

    // Solo el resultado de la venta cambia el pedido; VOID_* (anulaciones)
    // y eventos futuros se aceptan sin procesar para que Bold no reintente.
    if (event.type !== "SALE_APPROVED" && event.type !== "SALE_REJECTED") {
      return { ok: true, ignored: true };
    }

    const reference = event.data?.metadata?.reference;
    const paymentId = event.data?.payment_id;
    if (!reference || !paymentId) {
      return { ok: false, error: "Transacción incompleta" };
    }

    return {
      ok: true,
      orderRef: reference,
      paymentStatus: event.type === "SALE_APPROVED" ? "paid" : "failed",
      providerRef: paymentId,
      providerStatus: event.type,
    };
  },
};
