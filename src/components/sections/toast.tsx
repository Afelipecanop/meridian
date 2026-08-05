"use client";

import { useEffect, useState } from "react";
import type { ToastSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

/** Aviso de compra reciente: aparece una vez tras un retraso y se oculta solo. */
export function ToastSection({ settings }: SectionProps<ToastSettings>) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(
      () => setShow(true),
      settings.delaySeconds * 1000,
    );
    const hideTimer = setTimeout(
      () => setShow(false),
      (settings.delaySeconds + settings.durationSeconds) * 1000,
    );
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [settings.delaySeconds, settings.durationSeconds]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-40 flex max-w-[270px] items-center gap-2.5 rounded-2xl border border-(--lp-text)/10 bg-(--lp-bg) px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-400 ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-(--lp-primary)" aria-hidden />
      <p className="text-xs leading-snug text-(--lp-text)/70">
        <strong className="font-semibold text-(--lp-text)">{settings.name}</strong>
        {" en "}
        {settings.location} acaba de pedir el suyo · {settings.timeText}
      </p>
    </div>
  );
}
