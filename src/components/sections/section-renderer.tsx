import type { ComponentType } from "react";
import type { Landing, LandingSection, Product } from "@/db/schema";
import { isSectionType, sectionRegistry } from "./registry";

type Props = {
  sections: LandingSection[];
  landing: Landing;
  product: Product | null;
};

/**
 * Renderiza la lista de secciones de una landing. Los settings se validan
 * con el esquema Zod de cada tipo (rellenando defaults); secciones de tipo
 * desconocido u ocultas se omiten sin romper la página.
 */
export function SectionRenderer({ sections, landing, product }: Props) {
  return (
    <>
      {sections
        .filter((section) => section.visible)
        .map((section) => {
          if (!isSectionType(section.type)) return null;
          const entry = sectionRegistry[section.type];
          const parsed = entry.schema.safeParse(section.settings ?? {});
          const settings = parsed.success ? parsed.data : entry.defaults;
          const Section = entry.component as ComponentType<{
            settings: unknown;
            landing: Landing;
            product: Product | null;
          }>;
          return (
            <Section
              key={section.id}
              settings={settings}
              landing={landing}
              product={product}
            />
          );
        })}
    </>
  );
}
