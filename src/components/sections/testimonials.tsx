import { Star } from "lucide-react";
import type { TestimonialsSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

export function TestimonialsSection({
  settings,
}: SectionProps<TestimonialsSettings>) {
  if (settings.items.length === 0) return null;

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-5xl">
        {settings.title ? (
          <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
            {settings.title}
          </h2>
        ) : null}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {settings.items.map((item, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-xl border border-(--lp-text)/10 bg-(--lp-text)/2 p-6"
            >
              <div className="flex gap-1" aria-label={`${item.rating} de 5 estrellas`}>
                {Array.from({ length: 5 }, (_, star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star < item.rating
                        ? "fill-(--lp-primary) text-(--lp-primary)"
                        : "text-(--lp-text)/20"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-sm text-(--lp-text)/80">
                “{item.text}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold">
                {item.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
