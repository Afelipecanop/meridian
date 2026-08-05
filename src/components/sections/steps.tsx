import type { StepsSettings } from "@/lib/zod-schemas/sections";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

export function StepsSection({ settings }: SectionProps<StepsSettings>) {
  if (settings.items.length === 0) return null;

  return (
    <section className="bg-(--lp-text)/[0.02] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-xl">
        {settings.eyebrow ? (
          <span className="text-xs font-semibold tracking-wide text-(--lp-primary) uppercase">
            {settings.eyebrow}
          </span>
        ) : null}
        <h2 className="mt-3 font-(family-name:--font-display) text-[28px] font-medium tracking-tight text-balance">
          {settings.title}
        </h2>

        <Reveal stagger className="mt-8 flex flex-col">
          {settings.items.map((item, i) => (
            <div key={i} className="relative flex gap-4.5 py-4">
              {i < settings.items.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-14 bottom-0 left-[19px] w-px bg-(--lp-text)/12"
                />
              ) : null}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--lp-text) font-(family-name:--font-display) text-base text-(--lp-bg)">
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className="font-semibold">{item.title}</h3>
                {item.description ? (
                  <p className="mt-1 text-sm text-(--lp-text)/70">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
