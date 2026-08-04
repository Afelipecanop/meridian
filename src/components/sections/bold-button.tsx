"use client";

import { useEffect, useRef } from "react";
import type { EmbeddedCheckout } from "@/lib/payments/provider";

/**
 * Botón de pagos embebido de Bold. El script oficial se monta con los
 * atributos data-* firmados en el servidor y se reemplaza a sí mismo por el
 * botón; al hacer clic abre el checkout de Bold en un modal
 * (data-render-mode="embedded") y al terminar redirige a la landing con
 * `?pedido=<id>`, donde el banner de resultado consulta el estado.
 */
export function BoldButton({ checkout }: { checkout: EmbeddedCheckout }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = checkout.scriptUrl;
    for (const [name, value] of Object.entries(checkout.attributes)) {
      script.setAttribute(name, value);
    }
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [checkout]);

  return <div ref={containerRef} className="flex min-h-12 justify-center" />;
}
