import { formatCurrency } from "@/lib/format";
import type { OfferSettings } from "@/lib/zod-schemas/sections";
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
    <section className="px-6 py-14">
      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-(--lp-primary)/30 bg-(--lp-primary)/5 p-8 text-center sm:p-12">
        {settings.badge ? (
          <span className="inline-block rounded-full bg-(--lp-primary) px-4 py-1.5 text-sm font-semibold text-white">
            {settings.badge}
          </span>
        ) : null}
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance">
          {settings.title}
        </h2>
        {settings.description ? (
          <p className="mt-2 text-(--lp-text)/70">{settings.description}</p>
        ) : null}
        <div className="mt-6 flex items-baseline justify-center gap-3">
          {hasCompare ? (
            <span className="text-xl text-(--lp-text)/50 line-through">
              {formatCurrency(product.compareAtPrice!)}
            </span>
          ) : null}
          <span className="text-5xl font-bold text-(--lp-primary)">
            {formatCurrency(product.price)}
          </span>
          {hasCompare ? (
            <span className="rounded-md bg-(--lp-primary)/15 px-2 py-1 text-sm font-semibold text-(--lp-primary)">
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
          <p className="mt-4 text-sm text-(--lp-text)/60">{settings.note}</p>
        ) : null}
      </div>
    </section>
  );
}
