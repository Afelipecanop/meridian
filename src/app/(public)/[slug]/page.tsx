import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaymentResultBanner } from "@/components/sections/payment-result";
import { PixelScripts } from "@/components/sections/pixels";
import { SectionRenderer } from "@/components/sections/section-renderer";
import { getPublishedLanding } from "@/lib/landings";

// ISR: la página se cachea y se regenera como máximo cada 5 minutos.
// Al publicar desde el editor (Etapa 4) se revalidará on-demand con
// revalidatePath(`/${slug}`).
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

const themeDefaults = {
  primaryColor: "#4f46e5",
  backgroundColor: "#ffffff",
  textColor: "#171717",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedLanding(slug);
  if (!data) return { title: "Página no encontrada" };

  const { landing, product } = data;
  const title = landing.seo.title || landing.name;
  const description =
    landing.seo.description || product?.description?.slice(0, 160) || undefined;
  const ogImage = landing.seo.ogImage || product?.images?.[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    title,
    description,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    alternates: { canonical: `/${landing.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/${landing.slug}`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublishedLanding(slug);
  if (!data) notFound();

  const { landing, product } = data;
  const theme = { ...themeDefaults, ...landing.theme };
  const hasStickyCta = landing.publishedSections.some(
    (s) => s.type === "sticky-cta" && s.visible,
  );

  const style = {
    "--lp-primary": theme.primaryColor,
    "--lp-bg": theme.backgroundColor,
    "--lp-text": theme.textColor,
    ...(theme.font ? { fontFamily: theme.font } : {}),
  } as CSSProperties;

  return (
    <main
      style={style}
      className="min-h-dvh bg-(--lp-bg) text-(--lp-text) antialiased"
    >
      <PaymentResultBanner />
      <SectionRenderer
        sections={landing.publishedSections}
        landing={landing}
        product={product}
      />
      {/* Sin navegación de salida: la landing solo cierra con una línea legal. */}
      <footer
        className={`border-t border-(--lp-text)/10 px-6 py-8 text-center text-xs text-(--lp-text)/50 ${
          hasStickyCta ? "pb-24 md:pb-8" : ""
        }`}
      >
        © {new Date().getFullYear()} {landing.name}. Todos los derechos
        reservados.
      </footer>
      <PixelScripts pixels={landing.pixels} />
    </main>
  );
}
