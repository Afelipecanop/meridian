import type { Landing, Product } from "@/db/schema";

/** Contexto que recibe toda sección al renderizarse en la landing pública. */
export type SectionContext = {
  landing: Landing;
  product: Product | null;
};

export type SectionProps<TSettings> = SectionContext & {
  settings: TSettings;
};
