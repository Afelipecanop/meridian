import Image from "next/image";
import type { GallerySettings } from "@/lib/zod-schemas/sections";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

export function GallerySection({
  settings,
  product,
}: SectionProps<GallerySettings>) {
  const images =
    settings.images.length > 0 ? settings.images : (product?.images ?? []);
  if (images.length === 0) return null;

  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        {settings.title ? (
          <h2 className="font-(family-name:--font-display) text-[28px] font-medium tracking-tight text-balance">
            {settings.title}
          </h2>
        ) : null}
        <Reveal
          stagger
          className={`mt-8 grid gap-3.5 ${
            images.length === 1
              ? "grid-cols-1"
              : images.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-2xl border border-(--lp-text)/10"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 1024px) 20rem, 50vw"
                className="object-cover transition duration-300 hover:scale-105"
              />
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
