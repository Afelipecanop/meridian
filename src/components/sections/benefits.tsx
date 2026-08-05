import { Check } from "lucide-react";
import type { BenefitsSettings } from "@/lib/zod-schemas/sections";
import { sectionIcons } from "./icons";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

export function BenefitsSection({ settings }: SectionProps<BenefitsSettings>) {
  if (settings.items.length === 0) return null;

  const [featured, ...rest] = settings.items;
  const FeaturedIcon = sectionIcons[featured.icon] ?? Check;

  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        {settings.title ? (
          <h2 className="max-w-[22ch] font-(family-name:--font-display) text-[30px] font-medium tracking-tight text-balance">
            {settings.title}
          </h2>
        ) : null}

        <div className="mt-9">
          <Reveal className="mb-4 flex items-start gap-5 rounded-3xl border border-(--lp-text)/10 bg-(--lp-primary)/5 p-7 sm:p-8.5">
            <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-(--lp-text)/10 bg-(--lp-bg) text-(--lp-primary)">
              <FeaturedIcon className="h-6.5 w-6.5" aria-hidden />
            </span>
            <div>
              <h3 className="font-(family-name:--font-display) text-[22px] font-medium">
                {featured.title}
              </h3>
              {featured.description ? (
                <p className="mt-1 text-(--lp-text)/70">{featured.description}</p>
              ) : null}
            </div>
          </Reveal>

          {rest.length > 0 ? (
            <Reveal
              stagger
              className="grid grid-cols-1 gap-3.5 sm:grid-cols-2"
            >
              {rest.map((item, i) => {
                const Icon = sectionIcons[item.icon] ?? Check;
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-(--lp-text)/10 p-5.5 transition hover:-translate-y-0.5 hover:border-(--lp-text)/20"
                  >
                    <Icon className="h-6 w-6 text-(--lp-primary)" aria-hidden />
                    <h3 className="mt-3 text-[15.5px] font-semibold">
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p className="mt-1 text-sm text-(--lp-text)/70">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
