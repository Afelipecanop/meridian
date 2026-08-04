import { z } from "zod";

/** Payload del formulario de pedido público (compartido cliente/servidor). */
export const checkoutSchema = z.object({
  landingId: z.uuid(),
  name: z.string().trim().min(2, "Escribe tu nombre").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Escribe un teléfono válido")
    .max(20)
    .regex(/^[+\d][\d\s().-]*$/, "Escribe un teléfono válido"),
  email: z.union([z.email("Correo inválido"), z.literal("")]).optional(),
  address: z.string().trim().min(5, "Escribe la dirección de entrega").max(300),
  city: z.string().trim().min(2, "Escribe tu ciudad").max(120),
  notes: z.string().trim().max(500).optional(),
  quantity: z.number().int().min(1).max(99),
  /**
   * Honeypot: los humanos no ven este campo. Si llega con valor, la ruta
   * responde un éxito falso sin crear pedido (no validar aquí con max(0):
   * un 400 le daría al bot la señal de que fue detectado).
   */
  website: z.string().max(200).optional(),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export type CheckoutResponse =
  | {
      success: true;
      orderId: string;
      /** Presente en modo pasarela: URL a la que redirigir para pagar. */
      redirectUrl?: string;
    }
  | { success: false; error: string };
