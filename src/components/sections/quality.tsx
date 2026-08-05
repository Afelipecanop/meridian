import { Check } from "lucide-react";
import type { QualitySettings } from "@/lib/zod-schemas/sections";
import { sectionIcons } from "./icons";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

export function QualitySection({ settings }: SectionProps<QualitySettings>) {
  if (settings.items.length === 0) return null;

  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        {settings.eyebrow ? (
          <span className="text-xs font-semibold tracking-wide text-(--lp-primary) uppercase">
            {settings.eyebrow}
          </span>
        ) : null}
        <h2 className="mt-3 max-w-[24ch] font-(family-name:--font-display) text-[28px] font-medium tracking-tight text-balance">
          {settings.title}
        </h2>

        <Reveal
          stagger
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {settings.items.map((item, i) => {
            const Icon = sectionIcons[item.icon] ?? Check;
            return (
              <div
                key={i}
                className="rounded-2xl border border-(--lp-text)/10 px-5 py-7 text-center"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-(--lp-primary)/10 text-(--lp-primary)">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3.5 font-semibold">{item.title}</h3>
                {item.description ? (
                  <p className="mt-1 text-sm text-(--lp-text)/70">
                    {item.description}
                  </p>
                ) : null}
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
