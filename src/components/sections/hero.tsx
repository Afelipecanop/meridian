import Image from "next/image";
import { Package, Sparkles, Star } from "lucide-react";
import type { HeroSettings } from "@/lib/zod-schemas/sections";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

export function HeroSection({ settings, product }: SectionProps<HeroSettings>) {
  const image = settings.image || product?.images?.[0] || "";
  const rating = settings.rating.trim();
  const ratingCount = settings.ratingCount.trim();

  return (
    <section data-lp-hero className="px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          {settings.badge ? (
            <span className="mb-3.5 inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide text-(--lp-primary) uppercase">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {settings.badge}
            </span>
          ) : null}
          <h1 className="max-w-[13ch] font-(family-name:--font-display) text-[38px] leading-[1.1] font-medium tracking-tight text-balance sm:text-[50px]">
            {settings.title}
          </h1>
          {settings.subtitle ? (
            <p className="mt-4 max-w-[46ch] text-lg text-(--lp-text)/70 text-pretty">
              {settings.subtitle}
            </p>
          ) : null}

          {rating || ratingCount ? (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {rating ? (
                <span className="flex items-center gap-0.5 text-(--lp-primary)" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      fill={i < Math.round(Number(rating)) ? "currentColor" : "none"}
                    />
                  ))}
                </span>
              ) : null}
              <span className="text-[13.5px] text-(--lp-text)/60">
                {[rating, ratingCount].filter(Boolean).join(" · ")}
              </span>
            </div>
          ) : null}

          {settings.ctaText ? (
            <a
              href={settings.ctaHref || "#pedido"}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--lp-primary) px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
            >
              {settings.ctaText}
            </a>
          ) : null}
        </div>

        <Reveal className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl border border-(--lp-text)/10 bg-(--lp-text)/[0.02] p-9">
          <div
            aria-hidden
            className="absolute -top-[40%] -right-[40%] h-3/5 w-3/5 rounded-full bg-(--lp-primary)/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-[30%] -left-[20%] h-3/5 w-3/5 rounded-full bg-(--lp-primary)/8 blur-3xl"
          />
          {image ? (
            <div className="lp-float relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl">
              <Image
                src={image}
                alt={settings.title}
                fill
                priority
                sizes="(min-width: 1024px) 30rem, 70vw"
                className="object-cover"
              />
            </div>
          ) : (
            <Package
              className="lp-float relative z-10 h-28 w-28 text-(--lp-primary)/70"
              strokeWidth={1.25}
              aria-hidden
            />
          )}
        </Reveal>
      </div>
    </section>
  );
}
