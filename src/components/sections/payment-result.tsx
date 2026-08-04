"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import type { CheckoutStatusResponse } from "@/app/api/checkout/status/route";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~1 minuto esperando el webhook

type BannerState = "pending" | "paid" | "failed" | null;

/**
 * Banner de resultado de pago. Se muestra solo cuando la URL trae
 * `?pedido=<id>` (retorno de la pasarela) y el pedido es de pago online.
 * Es 100% cliente para no volver dinámica la página ISR de la landing.
 */
export function PaymentResultBanner() {
  const [state, setState] = useState<BannerState>(null);
  const [dismissed, setDismissed] = useState(false);
  const polls = useRef(0);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("pedido");
    if (!orderId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      try {
        const res = await fetch(`/api/checkout/status?order=${orderId}`);
        if (!res.ok) return;
        const data = (await res.json()) as CheckoutStatusResponse;
        if (cancelled || !data.found || data.paymentMethod !== "gateway") {
          return;
        }
        if (data.paymentStatus === "paid") {
          setState("paid");
        } else if (data.paymentStatus === "failed") {
          setState("failed");
        } else {
          setState("pending");
          polls.current += 1;
          if (polls.current < MAX_POLLS) {
            timer = setTimeout(check, POLL_INTERVAL_MS);
          }
        }
      } catch {
        // Silencioso: el banner es informativo.
      }
    }

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!state || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("pedido");
    window.history.replaceState(null, "", url.toString());
  }

  const content = {
    pending: {
      icon: (
        <Loader2
          className="h-5 w-5 shrink-0 animate-spin text-(--lp-primary)"
          aria-hidden
        />
      ),
      title: "Confirmando tu pago…",
      detail: "Esto puede tardar unos segundos. No cierres esta página.",
    },
    paid: {
      icon: (
        <CheckCircle2
          className="h-5 w-5 shrink-0 text-emerald-600"
          aria-hidden
        />
      ),
      title: "¡Pago aprobado!",
      detail: "Tu pedido quedó confirmado. Te contactaremos para la entrega.",
    },
    failed: {
      icon: <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />,
      title: "El pago no se completó",
      detail: "No se realizó ningún cobro. Puedes intentarlo de nuevo abajo.",
    },
  }[state];

  return (
    <div role="status" className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-xl border border-(--lp-text)/10 bg-(--lp-bg) p-4 shadow-lg">
        {content.icon}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{content.title}</p>
          <p className="mt-0.5 text-sm text-(--lp-text)/70">
            {content.detail}
            {state === "failed" ? (
              <>
                {" "}
                <a
                  href="#pedido"
                  onClick={dismiss}
                  className="font-medium text-(--lp-primary) underline underline-offset-2"
                >
                  Reintentar
                </a>
              </>
            ) : null}
          </p>
        </div>
        {state !== "pending" && (
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={dismiss}
            className="text-(--lp-text)/50 hover:text-(--lp-text)"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
