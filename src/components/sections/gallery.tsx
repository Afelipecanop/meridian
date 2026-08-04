import Image from "next/image";
import type { GallerySettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

export function GallerySection({
  settings,
  product,
}: SectionProps<GallerySettings>) {
  const images =
    settings.images.length > 0 ? settings.images : (product?.images ?? []);
  if (images.length === 0) return null;

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-5xl">
        {settings.title ? (
          <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
            {settings.title}
          </h2>
        ) : null}
        <div
          className={`mt-10 grid gap-4 ${
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
              className="relative aspect-square overflow-hidden rounded-xl"
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
        </div>
      </div>
    </section>
  );
}
