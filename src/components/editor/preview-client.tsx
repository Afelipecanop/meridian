"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Landing, Product } from "@/db/schema";
import type { LandingDraft } from "@/lib/zod-schemas/landing";
import { SectionRenderer } from "@/components/sections/section-renderer";
import type { PreviewMessage } from "./editor-shell";

const themeDefaults = {
  primaryColor: "#4f46e5",
  backgroundColor: "#ffffff",
  textColor: "#171717",
};

/**
 * Render del borrador dentro del iframe del editor. Usa los mismos
 * componentes de sección que la página pública; recibe actualizaciones
 * en vivo del editor vía postMessage.
 */
export function PreviewClient({
  landing,
  product: initialProduct,
}: {
  landing: Landing;
  product: Product | null;
}) {
  const [draft, setDraft] = useState<Pick<
    LandingDraft,
    "theme" | "sections"
  > | null>(null);
  const [product, setProduct] = useState(initialProduct);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as PreviewMessage | null;
      if (data?.type !== "meridian:preview") return;
      setDraft({ theme: data.draft.theme, sections: data.draft.sections });
      setProduct(data.product);
    }
    window.addEventListener("message", onMessage);
    // Avisa al editor que el iframe está listo para recibir el borrador.
    window.parent.postMessage(
      { type: "meridian:preview-ready" },
      window.location.origin,
    );
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const theme = { ...themeDefaults, ...(draft?.theme ?? landing.theme) };
  const sections = draft?.sections ?? landing.sections;

  const style = {
    "--lp-primary": theme.primaryColor,
    "--lp-bg": theme.backgroundColor,
    "--lp-text": theme.textColor,
    ...(theme.font ? { fontFamily: theme.font } : {}),
  } as CSSProperties;

  return (
    <main
      style={style}
      className="min-h-dvh bg-(--lp-bg) text-(--lp-text) antialiased"
    >
      <SectionRenderer
        sections={sections}
        landing={landing}
        product={product}
      />
      <footer className="px-6 py-8 text-center text-xs text-(--lp-text)/50">
        © {new Date().getFullYear()} {landing.name}. Todos los derechos
        reservados.
      </footer>
    </main>
  );
}
