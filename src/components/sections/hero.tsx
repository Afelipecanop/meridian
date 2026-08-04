import Image from "next/image";
import type { HeroSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

export function HeroSection({ settings, product }: SectionProps<HeroSettings>) {
  const image = settings.image || product?.images?.[0] || "";

  return (
    <section className="px-6 py-16 sm:py-24">
      <div
        className={`mx-auto grid max-w-5xl items-center gap-10 ${
          image ? "lg:grid-cols-2" : "text-center"
        }`}
      >
        <div className={image ? "" : "mx-auto max-w-2xl"}>
          {settings.badge ? (
            <span className="inline-block rounded-full bg-(--lp-primary)/10 px-4 py-1.5 text-sm font-medium text-(--lp-primary)">
              {settings.badge}
            </span>
          ) : null}
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {settings.title}
          </h1>
          {settings.subtitle ? (
            <p className="mt-4 text-lg text-(--lp-text)/70 text-pretty">
              {settings.subtitle}
            </p>
          ) : null}
          {settings.ctaText ? (
            <a
              href={settings.ctaHref || "#pedido"}
              className="mt-8 inline-block rounded-full bg-(--lp-primary) px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:opacity-90"
            >
              {settings.ctaText}
            </a>
          ) : null}
        </div>
        {image ? (
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            <Image
              src={image}
              alt={settings.title}
              fill
              priority
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
