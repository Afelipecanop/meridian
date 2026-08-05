import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Ban, Monitor, Smartphone } from "lucide-react";

type EmptyStateAction = {
  href: string;
  label: string;
};

type EmptyStateScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: EmptyStateAction;
  /** Muestra un mini diagrama "móvil bloqueado → escritorio permitido". */
  showDeviceHint?: boolean;
};

export function EmptyStateScreen({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  showDeviceHint = false,
}: EmptyStateScreenProps) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a0f] to-[#020203] px-6 text-center text-[#EDEDEF]">
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#5E6AD2]/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -right-16 -bottom-24 h-80 w-80 rounded-full bg-[#8B5CF6]/10 blur-[100px] [animation-delay:-9s]"
      />

      <div className="animate-rise relative z-10 flex w-full max-w-sm flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_30px_rgba(94,106,210,0.15)]">
          <Icon className="h-6 w-6 text-[#5E6AD2]" aria-hidden />
        </div>

        {showDeviceHint && (
          <div
            className="mt-5 flex items-center gap-2.5"
            role="img"
            aria-label="Dispositivo móvil no permitido, computador permitido"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
              <Smartphone className="h-4 w-4 text-[#8A8F98]" aria-hidden />
              <Ban className="absolute h-5 w-5 text-red-400/80" aria-hidden />
            </div>
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-[#8A8F98]/40"
              aria-hidden
            />
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#5E6AD2]/40 bg-[#5E6AD2]/10">
              <Monitor className="h-4 w-4 text-[#5E6AD2]" aria-hidden />
            </div>
          </div>
        )}

        <p className="mt-5 text-xs font-medium tracking-wide text-[#8A8F98] uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-3 max-w-[22rem] text-sm leading-relaxed text-[#8A8F98]">
          {description}
        </p>

        <div className="mt-8">
          <Link
            href={action.href}
            className="group inline-flex items-center gap-2 rounded-xl bg-[#5E6AD2] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(94,106,210,0.35)] transition-all duration-200 hover:bg-[#6E7AE2] hover:shadow-[0_0_56px_rgba(94,106,210,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E6AD2]"
          >
            {action.label}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
