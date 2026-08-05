import { z } from "zod";
import { isValidCity, isValidDepartment } from "@/lib/colombia-geo";
import { isValidCountryCode } from "@/lib/countries";
import type { EmbeddedCheckout } from "@/lib/payments/provider";

/** Payload del formulario de pedido público (compartido cliente/servidor). */
export const checkoutSchema = z
  .object({
    landingId: z.uuid(),
    firstName: z.string().trim().min(2, "Ingrese un nombre válido").max(80),
    lastName: z.string().trim().min(2, "Ingrese un apellido válido").max(80),
    /** ISO 3166-1 alpha-2 del país del indicativo (ver src/lib/countries.ts). */
    phoneCountry: z.string().trim().length(2, "Selecciona un país"),
    /** Número local, sin indicativo. */
    phone: z
      .string()
      .trim()
      .min(6, "Ingrese un teléfono válido")
      .max(15, "Ingrese un teléfono válido")
      .regex(/^[\d\s-]+$/, "Ingrese un teléfono válido"),
    email: z.union([z.email("Correo inválido"), z.literal("")]).optional(),
    department: z.string().trim().min(1, "Selecciona un departamento").max(120),
    city: z.string().trim().min(1, "Selecciona una ciudad").max(120),
    address: z
      .string()
      .trim()
      .min(5, "Ingrese una dirección válida")
      .max(300),
    notes: z.string().trim().max(500).optional(),
    quantity: z.number().int().min(1).max(99),
    /**
     * Selección del comprador por cada variable del producto (talla, color,
     * sabor...), indexada por nombre de la variable. Solo se valida contra
     * las variables reales del producto en el servidor (ver api/checkout),
     * porque este schema no tiene acceso a la base de datos.
     */
    variants: z.record(z.string(), z.string()).default({}),
    /**
     * Solo obligatorio cuando la landing tiene checkoutMode="both": cuál de
     * las dos formas de pago eligió el comprador. Para "cod"/"gateway" el
     * servidor ignora este campo y usa el modo fijo de la landing.
     */
    paymentChoice: z.enum(["cod", "gateway"]).optional(),
    /**
     * Honeypot: los humanos no ven este campo. Si llega con valor, la ruta
     * responde un éxito falso sin crear pedido (no validar aquí con max(0):
     * un 400 le daría al bot la señal de que fue detectado).
     */
    website: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (!isValidCountryCode(data.phoneCountry)) {
      ctx.addIssue({
        code: "custom",
        message: "Selecciona un país válido",
        path: ["phoneCountry"],
      });
    }
    if (!isValidDepartment(data.department)) {
      ctx.addIssue({
        code: "custom",
        message: "Selecciona un departamento válido",
        path: ["department"],
      });
    } else if (!isValidCity(data.department, data.city)) {
      ctx.addIssue({
        code: "custom",
        message: "Selecciona una ciudad válida",
        path: ["city"],
      });
    }
  });

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export type CheckoutResponse =
  | {
      success: true;
      orderId: string;
      /** Presente en modo pasarela: URL a la que redirigir para pagar. */
      redirectUrl?: string;
      /** Presente en modo pasarela con botón embebido (Bold). */
      embedded?: EmbeddedCheckout;
    }
  | { success: false; error: string };
