"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { LandingDraft } from "@/lib/zod-schemas/landing";
import { slugify } from "@/lib/slug";
import { fontOptions } from "./field-defs";
import { ImageControl, selectClass } from "./field-controls";

type ColorKey = "primaryColor" | "backgroundColor" | "textColor";

const colorFields: { key: ColorKey; label: string; fallback: string }[] = [
  { key: "primaryColor", label: "Color primario", fallback: "#4f46e5" },
  { key: "backgroundColor", label: "Fondo", fallback: "#ffffff" },
  { key: "textColor", label: "Texto", fallback: "#171717" },
];

/** Panel derecho: ajustes globales de la landing. */
export function LandingSettingsPanel({
  draft,
  products,
  onChange,
}: {
  draft: LandingDraft;
  products: { id: string; name: string }[];
  onChange: (patch: Partial<LandingDraft>) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-sm font-semibold">Ajustes de la landing</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Nombre, URL, producto, tema, SEO y píxeles
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ls-name" className="text-xs">
          Nombre interno
        </Label>
        <Input
          id="ls-name"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ls-slug" className="text-xs">
          Slug (URL pública)
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/</span>
          <Input
            id="ls-slug"
            value={draft.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            onBlur={(e) => onChange({ slug: slugify(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ls-product" className="text-xs">
          Producto asociado
        </Label>
        <select
          id="ls-product"
          value={draft.productId ?? ""}
          onChange={(e) =>
            onChange({ productId: e.target.value === "" ? null : e.target.value })
          }
          className={selectClass}
        >
          <option value="">Sin producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ls-checkout" className="text-xs">
          Modo de checkout
        </Label>
        <select
          id="ls-checkout"
          value={draft.checkoutMode}
          onChange={(e) =>
            onChange({
              checkoutMode: e.target.value as "cod" | "gateway" | "both",
            })
          }
          className={selectClass}
        >
          <option value="cod">Contra entrega (COD)</option>
          <option value="gateway">Pago online (pasarela)</option>
          <option value="both">Ambos (cliente elige)</option>
        </select>
      </div>

      <Separator />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tema
      </h3>

      {colorFields.map(({ key, label, fallback }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <Label htmlFor={`ls-${key}`} className="text-xs">
            {label}
          </Label>
          <div className="flex items-center gap-2">
            <input
              id={`ls-${key}`}
              type="color"
              value={draft.theme[key] ?? fallback}
              onChange={(e) =>
                onChange({ theme: { ...draft.theme, [key]: e.target.value } })
              }
              className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent"
            />
            <span className="w-18 text-xs tabular-nums text-muted-foreground">
              {draft.theme[key] ?? fallback}
            </span>
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ls-font" className="text-xs">
          Fuente
        </Label>
        <select
          id="ls-font"
          value={draft.theme.font ?? ""}
          onChange={(e) =>
            onChange({
              theme: { ...draft.theme, font: e.target.value || undefined },
            })
          }
          className={selectClass}
        >
          {fontOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Separator />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        SEO
      </h3>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ls-seo-title" className="text-xs">
          Título (vacío = nombre)
        </Label>
        <Input
          id="ls-seo-title"
          value={draft.seo.title ?? ""}
          onChange={(e) =>
            onChange({ seo: { ...draft.seo, title: e.target.value || undefined } })
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ls-seo-description" className="text-xs">
          Descripción
        </Label>
        <Textarea
          id="ls-seo-description"
          rows={3}
          value={draft.seo.description ?? ""}
          onChange={(e) =>
            onChange({
              seo: { ...draft.seo, description: e.target.value || undefined },
            })
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Imagen para compartir (OG)</Label>
        <ImageControl
          value={draft.seo.ogImage ?? ""}
          onChange={(v) =>
            onChange({ seo: { ...draft.seo, ogImage: v || undefined } })
          }
        />
      </div>

      <Separator />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Píxeles de seguimiento
      </h3>

      {(
        [
          ["metaPixelId", "Meta Pixel ID"],
          ["tiktokPixelId", "TikTok Pixel ID"],
          ["gaId", "Google Analytics ID"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`ls-${key}`} className="text-xs">
            {label}
          </Label>
          <Input
            id={`ls-${key}`}
            value={draft.pixels[key] ?? ""}
            onChange={(e) =>
              onChange({
                pixels: { ...draft.pixels, [key]: e.target.value || undefined },
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
