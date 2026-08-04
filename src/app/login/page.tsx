import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión — Meridian",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a0f] to-[#020203] px-6 text-[#EDEDEF]">
      {/* Luces ambientales */}
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#5E6AD2]/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -right-16 -bottom-24 h-80 w-80 rounded-full bg-[#8B5CF6]/10 blur-[100px] [animation-delay:-9s]"
      />

      <div className="animate-rise relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-colors duration-200 hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E6AD2]"
            aria-label="Volver al inicio"
          >
            <Compass className="h-6 w-6 text-[#5E6AD2]" aria-hidden />
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Bienvenido a Meridian
            </h1>
            <p className="mt-1 text-sm text-[#8A8F98]">
              Inicia sesión para entrar al panel
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-[#8A8F98]/60">
          Acceso exclusivo para administradores
        </p>
      </div>
    </main>
  );
}
