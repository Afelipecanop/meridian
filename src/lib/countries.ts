/**
 * Países para el selector de indicativo telefónico del formulario de pedido.
 * Colombia primero y por defecto (mercado principal); el resto en orden
 * alfabético.
 */

export type Country = {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  dialCode: string;
};

export const DEFAULT_COUNTRY_CODE = "CO";

export const COUNTRIES: Country[] = [
  { code: "CO", name: "Colombia", dialCode: "+57" },
  { code: "AR", name: "Argentina", dialCode: "+54" },
  { code: "BO", name: "Bolivia", dialCode: "+591" },
  { code: "BR", name: "Brasil", dialCode: "+55" },
  { code: "CA", name: "Canadá", dialCode: "+1" },
  { code: "CL", name: "Chile", dialCode: "+56" },
  { code: "CR", name: "Costa Rica", dialCode: "+506" },
  { code: "CU", name: "Cuba", dialCode: "+53" },
  { code: "EC", name: "Ecuador", dialCode: "+593" },
  { code: "SV", name: "El Salvador", dialCode: "+503" },
  { code: "ES", name: "España", dialCode: "+34" },
  { code: "US", name: "Estados Unidos", dialCode: "+1" },
  { code: "GT", name: "Guatemala", dialCode: "+502" },
  { code: "HN", name: "Honduras", dialCode: "+504" },
  { code: "MX", name: "México", dialCode: "+52" },
  { code: "NI", name: "Nicaragua", dialCode: "+505" },
  { code: "PA", name: "Panamá", dialCode: "+507" },
  { code: "PY", name: "Paraguay", dialCode: "+595" },
  { code: "PE", name: "Perú", dialCode: "+51" },
  { code: "PR", name: "Puerto Rico", dialCode: "+1" },
  { code: "DO", name: "República Dominicana", dialCode: "+1" },
  { code: "UY", name: "Uruguay", dialCode: "+598" },
  { code: "VE", name: "Venezuela", dialCode: "+58" },
];

export function isValidCountryCode(code: string): boolean {
  return COUNTRIES.some((c) => c.code === code);
}

export function dialCodeFor(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.dialCode ?? "+57";
}

/** Emoji de bandera a partir del código ISO alpha-2 (ej. "CO" → 🇨🇴). */
export function countryFlagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );
}
