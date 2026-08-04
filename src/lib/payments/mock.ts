import { createHash } from "node:crypto";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  WebhookResult,
} from "./provider";

/**
 * Pasarela simulada para desarrollo y pruebas e2e (PAYMENT_PROVIDER=mock).
 * - createCheckout "redirige" de vuelta a la landing (no hay página externa).
 * - El webhook se dispara manualmente:
 *     POST /api/webhooks/mock
 *     { "reference": "<orderId>", "status": "APPROVED" | "DECLINED" }
 *   firmado con el header `x-mock-signature`:
 *     sha256(`${reference}${status}${MOCK_WEBHOOK_SECRET}`)
 * Nunca usar en producción.
 */

function secret(): string {
  return process.env.MOCK_WEBHOOK_SECRET ?? "mock-secret";
}

export function mockSignature(reference: string, status: string): string {
  return createHash("sha256")
    .update(`${reference}${status}${secret()}`)
    .digest("hex");
}

export const mockProvider: PaymentProvider = {
  name: "mock",

  async createCheckout({
    order,
    redirectUrl,
  }: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    void order;
    // Sin pasarela real: el comprador "vuelve" de inmediato con el pago pendiente.
    return { ok: true, redirectUrl };
  },

  async verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<WebhookResult> {
    let payload: { reference?: string; status?: string };
    try {
      payload = JSON.parse(rawBody) as { reference?: string; status?: string };
    } catch {
      return { ok: false, error: "Cuerpo inválido" };
    }

    const { reference, status } = payload;
    if (!reference || !status) {
      return { ok: false, error: "reference y status son obligatorios" };
    }

    const received = headers.get("x-mock-signature") ?? "";
    if (received !== mockSignature(reference, status)) {
      return { ok: false, error: "Firma inválida" };
    }

    return {
      ok: true,
      orderRef: reference,
      paymentStatus: status === "APPROVED" ? "paid" : "failed",
      providerRef: `mock-${reference.slice(0, 8)}`,
      providerStatus: status,
    };
  },
};
