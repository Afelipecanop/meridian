"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { StickyCtaSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

/**
 * Barra de compra fija en móvil: aparece al salir el hero de la vista.
 * Solo visible en pantallas angostas (md:hidden), igual que en el mockup.
 */
export function StickyCtaSection({
  settings,
  product,
}: SectionProps<StickyCtaSettings>) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-lp-hero]");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (!product) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-(--lp-text)/10 bg-(--lp-bg) px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-xs text-(--lp-text)/60">
          {settings.label || product.name}
        </p>
        <strong className="font-(family-name:--font-display) text-lg">
          {formatCurrency(product.price)}
        </strong>
      </div>
      <a
        href={settings.ctaHref || "#pedido"}
        className="shrink-0 rounded-full bg-(--lp-primary) px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {settings.ctaText}
      </a>
    </div>
  );
}
