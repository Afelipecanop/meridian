"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { COLOMBIA_DEPARTMENTS, citiesForDepartment } from "@/lib/colombia-geo";
import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  countryFlagEmoji,
} from "@/lib/countries";
import type { EmbeddedCheckout } from "@/lib/payments/provider";
import type { OrderFormSettings } from "@/lib/zod-schemas/sections";
import { checkoutSchema, type CheckoutResponse } from "@/lib/zod-schemas/checkout";
import { BoldButton } from "./bold-button";
import type { SectionProps } from "./types";

const inputClass =
  "w-full rounded-xl border border-(--lp-text)/15 bg-transparent px-3.5 py-2.5 text-[14.5px] outline-none transition placeholder:text-(--lp-text)/40 focus:border-(--lp-primary) focus:ring-2 focus:ring-(--lp-primary)/20";

type FieldErrors = Partial<Record<string, string>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-red-500">
      {message}
    </p>
  );
}

const paymentChoiceOptions = [
  { value: "cod", label: "Pago contra entrega" },
  { value: "gateway", label: "Pago anticipado" },
] as const;

export function OrderFormSection({
  settings,
  landing,
  product,
}: SectionProps<OrderFormSettings>) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY_CODE);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentChoice, setPaymentChoice] = useState<"cod" | "gateway">("cod");
  const honeypotRef = useRef<HTMLInputElement>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [embedded, setEmbedded] = useState<EmbeddedCheckout | null>(null);
  const [error, setError] = useState("");

  const unitPrice = product ? Number(product.price) : 0;
  const total = unitPrice * quantity;
  const cities = useMemo(() => citiesForDepartment(department), [department]);
  const showPaymentChoice = landing.checkoutMode === "both";
  const effectivePaymentMethod =
    landing.checkoutMode === "both" ? paymentChoice : landing.checkoutMode;

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function resetForm() {
    setFirstName("");
    setLastName("");
    setPhoneCountry(DEFAULT_COUNTRY_CODE);
    setPhone("");
    setEmail("");
    setDepartment("");
    setCity("");
    setAddress("");
    setNotes("");
    setQuantity(1);
    setPaymentChoice("cod");
    setFieldErrors({});
  }

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

    const validation = checkoutSchema.safeParse({
      landingId: landing.id,
      firstName,
      lastName,
      phoneCountry,
      phone,
      email,
      department,
      city,
      address,
      notes,
      quantity,
      ...(showPaymentChoice ? { paymentChoice } : {}),
      website: honeypotRef.current?.value ?? "",
    });

    if (!validation.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of validation.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (data.success && data.redirectUrl) {
        // Modo pasarela: seguimos al pago (el estado se confirma al volver).
        window.location.assign(data.redirectUrl);
        return;
      }
      if (data.success && data.embedded) {
        // Pasarela embebida (Bold): el pedido quedó pendiente; mostramos el
        // botón de pago y el webhook confirmará el resultado.
        setEmbedded(data.embedded);
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
    <section id={settings.anchorId || "pedido"} className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-(--lp-text)/10 bg-(--lp-bg) p-6 sm:p-8.5">
          {succeeded ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-(--lp-primary)/10 text-(--lp-primary)">
                <CheckCircle2 className="h-7 w-7" aria-hidden />
              </span>
              <h2 className="font-(family-name:--font-display) text-2xl font-medium tracking-tight text-balance">
                {settings.successTitle}
              </h2>
              <p className="text-sm text-(--lp-text)/70">
                {settings.successMessage}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSucceeded(false);
                  resetForm();
                }}
                className="mt-2 text-sm text-(--lp-primary) underline underline-offset-4"
              >
                Hacer otro pedido
              </button>
            </div>
          ) : embedded ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <h2 className="font-(family-name:--font-display) text-2xl font-medium tracking-tight text-balance">
                Pedido registrado
              </h2>
              <p className="text-sm text-(--lp-text)/70">
                Completa el pago con el botón seguro de Bold. Al terminar
                volverás a esta página para ver la confirmación.
              </p>
              <BoldButton checkout={embedded} />
              {product ? (
                <p className="text-sm text-(--lp-text)/70">
                  Total a pagar{" "}
                  <span className="font-bold text-(--lp-primary)">
                    {formatCurrency(total)}
                  </span>
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <h2 className="font-(family-name:--font-display) text-2xl font-medium tracking-tight text-balance">
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
                  ref={honeypotRef}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        clearError("firstName");
                      }}
                      placeholder="Nombres"
                      autoComplete="given-name"
                      className={inputClass}
                    />
                    <FieldError message={fieldErrors.firstName} />
                  </div>
                  <div>
                    <input
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        clearError("lastName");
                      }}
                      placeholder="Apellidos"
                      autoComplete="family-name"
                      className={inputClass}
                    />
                    <FieldError message={fieldErrors.lastName} />
                  </div>
                </div>

                <div>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountry}
                      onChange={(e) => {
                        setPhoneCountry(e.target.value);
                        clearError("phoneCountry");
                      }}
                      aria-label="País del teléfono"
                      className={`${inputClass} w-32 shrink-0`}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {countryFlagEmoji(c.code)} {c.dialCode}
                        </option>
                      ))}
                    </select>
                    <input
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearError("phone");
                      }}
                      type="tel"
                      placeholder="Teléfono / WhatsApp"
                      autoComplete="tel-national"
                      className={inputClass}
                    />
                  </div>
                  <FieldError
                    message={fieldErrors.phone ?? fieldErrors.phoneCountry}
                  />
                </div>

                {settings.showEmail ? (
                  <div>
                    <input
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      type="email"
                      placeholder="Correo (opcional)"
                      autoComplete="email"
                      className={inputClass}
                    />
                    <FieldError message={fieldErrors.email} />
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setCity("");
                        clearError("department");
                      }}
                      aria-label="Departamento"
                      className={inputClass}
                    >
                      <option value="">Departamento</option>
                      {COLOMBIA_DEPARTMENTS.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors.department} />
                  </div>
                  <div>
                    <select
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        clearError("city");
                      }}
                      disabled={!department}
                      aria-label="Ciudad"
                      className={`${inputClass} disabled:opacity-50`}
                    >
                      <option value="">
                        {department ? "Ciudad" : "Elige el departamento"}
                      </option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors.city} />
                  </div>
                </div>

                <div>
                  <input
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      clearError("address");
                    }}
                    placeholder="Dirección y complementos (apto, interior, barrio...)"
                    autoComplete="street-address"
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors.address} />
                </div>

                {settings.showNotes ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Notas del pedido (opcional)"
                    className={inputClass}
                  />
                ) : null}

                <div className="flex items-center justify-between rounded-xl border border-(--lp-text)/10 px-4 py-3">
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

                {showPaymentChoice ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Forma de pago</span>
                    <div
                      role="radiogroup"
                      aria-label="Forma de pago"
                      className="grid grid-cols-2 gap-2 rounded-xl border border-(--lp-text)/15 p-1"
                    >
                      {paymentChoiceOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={paymentChoice === option.value}
                          onClick={() => setPaymentChoice(option.value)}
                          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                            paymentChoice === option.value
                              ? "bg-(--lp-primary) text-white"
                              : "text-(--lp-text)/70 hover:bg-(--lp-text)/5"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {product ? (
                  <div className="flex items-center justify-between border-t border-(--lp-text)/10 pt-4 text-sm">
                    <span className="text-(--lp-text)/70">Total a pagar</span>
                    <span className="font-(family-name:--font-display) text-xl font-medium text-(--lp-primary)">
                      {formatCurrency(total)}
                    </span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-full bg-(--lp-primary) px-8 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {submitting
                    ? effectivePaymentMethod === "gateway"
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
