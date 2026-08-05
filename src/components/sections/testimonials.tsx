import { Star } from "lucide-react";
import type { TestimonialsSettings } from "@/lib/zod-schemas/sections";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TestimonialsSection({
  settings,
}: SectionProps<TestimonialsSettings>) {
  if (settings.items.length === 0) return null;

  return (
    <section className="bg-(--lp-text)/[0.02] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        {settings.title ? (
          <h2 className="font-(family-name:--font-display) text-[28px] font-medium tracking-tight text-balance">
            {settings.title}
          </h2>
        ) : null}
        <Reveal
          stagger
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {settings.items.map((item, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-2xl border border-(--lp-text)/10 bg-(--lp-bg) p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-full bg-(--lp-primary)/10 text-[13px] font-semibold text-(--lp-primary)">
                  {initials(item.name)}
                </span>
                <div
                  className="flex gap-0.5"
                  aria-label={`${item.rating} de 5 estrellas`}
                >
                  {Array.from({ length: 5 }, (_, star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star < item.rating
                          ? "fill-(--lp-primary) text-(--lp-primary)"
                          : "text-(--lp-text)/20"
                      }`}
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
              <blockquote className="flex-1 text-[14.5px] text-(--lp-text) italic">
                “{item.text}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-(--lp-text)/80">
                {item.name}
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
