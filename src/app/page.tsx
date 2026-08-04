import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-[#0a0a0f] to-[#020203] text-[#EDEDEF]">
      {/* Luces ambientales */}
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-[#5E6AD2]/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute right-1/5 bottom-0 h-80 w-80 rounded-full bg-[#8B5CF6]/10 blur-[100px] [animation-delay:-9s]"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <Compass className="h-4.5 w-4.5 text-[#5E6AD2]" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Meridian
          </span>
        </div>
        <Link
          href="/login"
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#EDEDEF] transition-colors duration-200 hover:border-white/20 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E6AD2]"
        >
          Iniciar sesión
        </Link>
      </header>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="animate-rise mb-5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#8A8F98]">
          Plataforma de landing pages de producto
        </p>
        <h1 className="animate-rise max-w-3xl text-4xl font-bold tracking-tight text-balance [animation-delay:80ms] sm:text-6xl">
          Cada producto merece una página que{" "}
          <span className="bg-gradient-to-r from-[#5E6AD2] via-[#818CF8] to-[#8B5CF6] bg-clip-text text-transparent">
            venda por sí sola
          </span>
        </h1>
        <p className="animate-rise mt-6 max-w-xl text-base leading-relaxed text-[#8A8F98] [animation-delay:160ms] sm:text-lg">
          Crea, edita y publica landings únicas con un editor visual de
          secciones. Pedidos, productos y páginas — todo en un solo lugar.
        </p>
        <div className="animate-rise mt-10 [animation-delay:240ms]">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#5E6AD2] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_40px_rgba(94,106,210,0.35)] transition-all duration-200 hover:bg-[#6E7AE2] hover:shadow-[0_0_56px_rgba(94,106,210,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E6AD2]"
          >
            Entrar al panel
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 px-6 py-6 text-center text-xs text-[#8A8F98]/60">
        Meridian — hecho para vender
      </footer>
    </main>
  );
}
