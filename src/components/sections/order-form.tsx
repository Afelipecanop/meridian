"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { OrderFormSettings } from "@/lib/zod-schemas/sections";
import type { CheckoutResponse } from "@/lib/zod-schemas/checkout";
import type { SectionProps } from "./types";

const inputClass =
  "w-full rounded-lg border border-(--lp-text)/15 bg-transparent px-3.5 py-2.5 text-sm outline-none transition placeholder:text-(--lp-text)/40 focus:border-(--lp-primary) focus:ring-2 focus:ring-(--lp-primary)/20";

export function OrderFormSection({
  settings,
  landing,
  product,
}: SectionProps<OrderFormSettings>) {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");

  const unitPrice = product ? Number(product.price) : 0;
  const total = unitPrice * quantity;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Dentro del iframe del editor solo simulamos el pedido.
    const isPreview =
      typeof window !== "undefined" && window.self !== window.top;
    if (isPreview) {
      setSucceeded(true);
      return;
    }

    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landingId: landing.id,
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          address: String(form.get("address") ?? ""),
          city: String(form.get("city") ?? ""),
          notes: String(form.get("notes") ?? ""),
          quantity,
          website: String(form.get("website") ?? ""),
        }),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (data.success && data.redirectUrl) {
        // Modo pasarela: seguimos al pago (el estado se confirma al volver).
        window.location.assign(data.redirectUrl);
        return;
      }
      if (data.success) {
        setSucceeded(true);
      } else {
        setError(data.error);
      }
    } catch {
      setError("No pudimos procesar tu pedido. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id={settings.anchorId || "pedido"} className="px-6 py-14">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-(--lp-text)/10 bg-(--lp-text)/2 p-6 sm:p-8">
          {succeeded ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2
                className="h-12 w-12 text-(--lp-primary)"
                aria-hidden
              />
              <h2 className="text-2xl font-bold tracking-tight text-balance">
                {settings.successTitle}
              </h2>
              <p className="text-sm text-(--lp-text)/70">
                {settings.successMessage}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSucceeded(false);
                  setQuantity(1);
                }}
                className="mt-2 text-sm text-(--lp-primary) underline underline-offset-4"
              >
                Hacer otro pedido
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight text-balance">
                {settings.title}
              </h2>
              {settings.subtitle ? (
                <p className="mt-1 text-sm text-(--lp-text)/70">
                  {settings.subtitle}
                </p>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                {/* Honeypot anti-spam: invisible para humanos */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />

                <input
                  name="name"
                  required
                  minLength={2}
                  placeholder="Nombre completo"
                  autoComplete="name"
                  className={inputClass}
                />
                <input
                  name="phone"
                  required
                  type="tel"
                  minLength={7}
                  placeholder="Teléfono / WhatsApp"
                  autoComplete="tel"
                  className={inputClass}
                />
                {settings.showEmail ? (
                  <input
                    name="email"
                    type="email"
                    placeholder="Correo (opcional)"
                    autoComplete="email"
                    className={inputClass}
                  />
                ) : null}
                <input
                  name="address"
                  required
                  minLength={5}
                  placeholder="Dirección de entrega"
                  autoComplete="street-address"
                  className={inputClass}
                />
                <input
                  name="city"
                  required
                  minLength={2}
                  placeholder="Ciudad"
                  autoComplete="address-level2"
                  className={inputClass}
                />
                {settings.showNotes ? (
                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={500}
                    placeholder="Notas del pedido (opcional)"
                    className={inputClass}
                  />
                ) : null}

                <div className="flex items-center justify-between rounded-lg border border-(--lp-text)/10 px-4 py-3">
                  <span className="text-sm font-medium">Cantidad</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Restar uno"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-(--lp-text)/15 transition hover:border-(--lp-primary) hover:text-(--lp-primary)"
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <span className="w-6 text-center font-semibold tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Sumar uno"
                      onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-(--lp-text)/15 transition hover:border-(--lp-primary) hover:text-(--lp-primary)"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>

                {product ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-(--lp-text)/70">Total a pagar</span>
                    <span className="text-xl font-bold text-(--lp-primary)">
                      {formatCurrency(total)}
                    </span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-full bg-(--lp-primary) px-8 py-3.5 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {submitting
                    ? landing.checkoutMode === "gateway"
                      ? "Redirigiendo al pago..."
                      : "Enviando..."
                    : settings.buttonText}
                </button>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-600"
                  >
                    {error}
                  </p>
                ) : null}

                {settings.footnote ? (
                  <p className="text-center text-xs text-(--lp-text)/60">
                    {settings.footnote}
                  </p>
                ) : null}
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
