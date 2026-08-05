"use client";

import { useEffect, useState } from "react";
import type { CountdownSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function getRemaining(endsAt: string): Remaining | null {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

export function CountdownSection({ settings }: SectionProps<CountdownSettings>) {
  // Se calcula solo en cliente para evitar desajustes de hidratación.
  const [remaining, setRemaining] = useState<Remaining | null | "loading">(
    "loading",
  );

  useEffect(() => {
    if (!settings.endsAt) return;
    const tick = () => setRemaining(getRemaining(settings.endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings.endsAt]);

  if (!settings.endsAt) return null;

  const units =
    remaining === "loading" || remaining === null
      ? null
      : ([
          ["Días", remaining.days],
          ["Horas", remaining.hours],
          ["Min", remaining.minutes],
          ["Seg", remaining.seconds],
        ] as const);

  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-(--lp-text) px-6 py-9 text-center text-(--lp-bg) sm:px-10">
        <p className="font-(family-name:--font-display) text-lg font-medium">
          {settings.title}
        </p>
        {remaining === null && settings.endsAt ? (
          <p className="mt-3 font-(family-name:--font-display) text-2xl font-medium">
            {settings.expiredText}
          </p>
        ) : (
          <div className="mt-4 flex justify-center gap-3 sm:gap-3.5">
            {(units ?? ([["Días", 0], ["Horas", 0], ["Min", 0], ["Seg", 0]] as const)).map(
              ([label, value]) => (
                <div
                  key={label}
                  className="flex w-16 flex-col rounded-xl bg-(--lp-bg)/10 py-2.5 sm:w-[72px] sm:py-3"
                >
                  <span className="font-(family-name:--font-display) text-2xl font-medium tabular-nums sm:text-[28px]">
                    {units ? String(value).padStart(2, "0") : "--"}
                  </span>
                  <span className="text-[11px] tracking-wide text-(--lp-bg)/60 uppercase">
                    {label}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
