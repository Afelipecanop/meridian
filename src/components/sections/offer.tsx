import { formatCurrency } from "@/lib/format";
import type { OfferSettings } from "@/lib/zod-schemas/sections";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

export function OfferSection({ settings, product }: SectionProps<OfferSettings>) {
  if (!product) return null;

  const hasCompare =
    settings.showCompareAtPrice &&
    product.compareAtPrice &&
    Number(product.compareAtPrice) > Number(product.price);

  const discount = hasCompare
    ? Math.round(
        (1 - Number(product.price) / Number(product.compareAtPrice)) * 100,
      )
    : 0;

  return (
    <section className="px-6 py-16 sm:py-20">
      <Reveal className="mx-auto max-w-2xl rounded-3xl bg-(--lp-text) px-7 py-10 text-center text-(--lp-bg) sm:px-14 sm:py-14">
        {settings.badge ? (
          <span className="inline-block rounded-full bg-(--lp-primary) px-4 py-1.5 text-sm font-semibold text-white">
            {settings.badge}
          </span>
        ) : null}
        <h2 className="mt-4 font-(family-name:--font-display) text-[26px] font-medium tracking-tight text-balance">
          {settings.title}
        </h2>
        {settings.description ? (
          <p className="mt-2 text-(--lp-bg)/70">{settings.description}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-baseline justify-center gap-3">
          {hasCompare ? (
            <span className="text-xl text-(--lp-bg)/45 line-through">
              {formatCurrency(product.compareAtPrice!)}
            </span>
          ) : null}
          <span className="font-(family-name:--font-display) text-4xl font-medium">
            {formatCurrency(product.price)}
          </span>
          {hasCompare ? (
            <span className="rounded-md bg-(--lp-primary)/25 px-2 py-1 text-sm font-semibold text-(--lp-bg)">
              −{discount}%
            </span>
          ) : null}
        </div>
        {settings.ctaText ? (
          <a
            href={settings.ctaHref || "#pedido"}
            className="mt-8 inline-block rounded-full bg-(--lp-primary) px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:opacity-90"
          >
            {settings.ctaText}
          </a>
        ) : null}
        {settings.note ? (
          <p className="mt-4 text-sm text-(--lp-bg)/55">{settings.note}</p>
        ) : null}
      </Reveal>
    </section>
  );
}
