import { createHash } from "node:crypto";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  WebhookResult,
} from "./provider";

/**
 * Wompi (Colombia) vía Web Checkout hosted:
 * - createCheckout construye la URL de https://checkout.wompi.co/p/ con la
 *   firma de integridad SHA-256(referencia + monto_en_centavos + moneda + secreto).
 * - verifyWebhook valida el checksum del evento: SHA-256(concat(valores de
 *   signature.properties) + timestamp + secreto_de_eventos).
 *
 * Sandbox: usa las llaves `pub_test_*` y los secretos de prueba del panel de
 * Wompi; la URL de checkout es la misma.
 */

const CHECKOUT_URL = "https://checkout.wompi.co/p/";

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

export function wompiIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
): string {
  return createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest("hex");
}

type WompiEvent = {
  event?: string;
  data?: {
    transaction?: {
      id?: string;
      status?: string;
      reference?: string;
      amount_in_cents?: number;
    };
  };
  timestamp?: number;
  signature?: { checksum?: string; properties?: string[] };
};

/** Lee una propiedad anidada tipo "transaction.status" dentro de `data`. */
function readProperty(data: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      data,
    );
}

export function wompiWebhookChecksum(
  event: WompiEvent,
  eventsSecret: string,
): string | null {
  const properties = event.signature?.properties;
  const timestamp = event.timestamp;
  if (!properties || timestamp === undefined || !event.data) return null;

  const concatenated = properties
    .map((p) => String(readProperty(event.data as Record<string, unknown>, p) ?? ""))
    .join("");

  return createHash("sha256")
    .update(`${concatenated}${timestamp}${eventsSecret}`)
    .digest("hex");
}

export const wompiProvider: PaymentProvider = {
  name: "wompi",

  async createCheckout({
    order,
    redirectUrl,
  }: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const publicKey = env("WOMPI_PUBLIC_KEY");
    const integritySecret = env("WOMPI_INTEGRITY_SECRET");
    if (!publicKey || !integritySecret) {
      return {
        ok: false,
        error:
          "Wompi no está configurado (WOMPI_PUBLIC_KEY / WOMPI_INTEGRITY_SECRET)",
      };
    }

    const currency = process.env.NEXT_PUBLIC_CURRENCY ?? "COP";
    const amountInCents = Math.round(Number(order.total) * 100);
    const reference = order.id;

    const params = new URLSearchParams({
      "public-key": publicKey,
      currency,
      "amount-in-cents": String(amountInCents),
      reference,
      "signature:integrity": wompiIntegritySignature(
        reference,
        amountInCents,
        currency,
        integritySecret,
      ),
      "redirect-url": redirectUrl,
    });
    if (order.customer.email) {
      params.set("customer-data:email", order.customer.email);
    }
    params.set(
      "customer-data:full-name",
      `${order.customer.nombres} ${order.customer.apellidos}`,
    );
    params.set("customer-data:phone-number", order.customer.telefono);

    return { ok: true, redirectUrl: `${CHECKOUT_URL}?${params.toString()}` };
  },

  async verifyWebhook(rawBody: string): Promise<WebhookResult> {
    const eventsSecret = env("WOMPI_EVENTS_SECRET");
    if (!eventsSecret) {
      return { ok: false, error: "WOMPI_EVENTS_SECRET no configurado" };
    }

    let event: WompiEvent;
    try {
      event = JSON.parse(rawBody) as WompiEvent;
    } catch {
      return { ok: false, error: "Cuerpo inválido" };
    }

    const expected = wompiWebhookChecksum(event, eventsSecret);
    const received = event.signature?.checksum;
    if (!expected || !received || expected.toLowerCase() !== received.toLowerCase()) {
      return { ok: false, error: "Firma inválida" };
    }

    if (event.event !== "transaction.updated") {
      // Auténtico pero irrelevante; 200 para que Wompi no reintente.
      return { ok: true, ignored: true };
    }

    const tx = event.data?.transaction;
    if (!tx?.reference || !tx.id || !tx.status) {
      return { ok: false, error: "Transacción incompleta" };
    }

    // APPROVED → pagado; DECLINED/VOIDED/ERROR → fallido.
    const paymentStatus = tx.status === "APPROVED" ? "paid" : "failed";

    return {
      ok: true,
      orderRef: tx.reference,
      paymentStatus,
      providerRef: tx.id,
      providerStatus: tx.status,
    };
  },
};
