import type { Order } from "@/db/schema";
import { mockProvider } from "./mock";
import { wompiProvider } from "./wompi";

/**
 * Capa agnóstica de pasarelas de pago. Cada implementación traduce dos
 * operaciones: crear un checkout (redirección) y verificar/normalizar su
 * webhook. Agregar una pasarela = implementar esta interfaz y registrarla
 * en `getPaymentProvider`.
 */

export type CreateCheckoutInput = {
  order: Order;
  landingSlug: string;
  /** URL absoluta a la que la pasarela devuelve al comprador. */
  redirectUrl: string;
};

export type CreateCheckoutResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

/** Resultado normalizado de un webhook ya verificado. */
export type WebhookResult =
  | {
      ok: true;
      ignored?: false;
      /** Referencia que enviamos al crear el checkout (id del pedido). */
      orderRef: string;
      paymentStatus: "paid" | "failed";
      /** Id de la transacción en la pasarela. */
      providerRef: string;
      providerStatus: string;
    }
  /** Evento auténtico pero irrelevante: responder 200 sin procesar. */
  | { ok: true; ignored: true }
  | { ok: false; error: string };

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  /** Verifica autenticidad del webhook a partir del cuerpo crudo y headers. */
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>;
}

export function getPaymentProvider(): PaymentProvider | null {
  const name = process.env.PAYMENT_PROVIDER;
  if (name === "mock") {
    // Solo para desarrollo/pruebas; nunca usar en producción.
    return mockProvider;
  }
  if (name === "wompi" || (!name && process.env.WOMPI_PUBLIC_KEY)) {
    return wompiProvider;
  }
  return null;
}
