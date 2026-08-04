"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { authenticate } from "./actions";

const inputClasses =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98]/50 transition-colors duration-200 hover:border-white/20 focus:border-[#5E6AD2] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/30";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5E6AD2] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(94,106,210,0.3)] transition-all duration-200 hover:bg-[#6E7AE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E6AD2] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? "Entrando..." : "Iniciar sesión"}
    </button>
  );
}

export function LoginForm() {
  const [errorMessage, formAction] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-[#EDEDEF]">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-[#EDEDEF]"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={`${inputClasses} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-[#8A8F98] transition-colors duration-200 hover:text-[#EDEDEF] focus-visible:outline-2 focus-visible:outline-[#5E6AD2]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {errorMessage}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
