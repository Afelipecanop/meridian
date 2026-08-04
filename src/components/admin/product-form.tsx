"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Product } from "@/db/schema";
import type { ProductFormState } from "@/app/admin/(shell)/products/actions";

type ProductAction = (
  prev: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-w-36">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending
        ? "Guardando..."
        : isEdit
          ? "Guardar cambios"
          : "Crear producto"}
    </Button>
  );
}

export function ProductForm({
  product,
  action,
}: {
  product?: Product;
  action: ProductAction;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, undefined);
  const [active, setActive] = useState(product?.active ?? true);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(product ? "Producto actualizado" : "Producto creado");
      router.push("/admin/products");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, product, router]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          toast.error(data.error ?? `No se pudo subir ${file.name}`);
          continue;
        }
        setImages((prev) => [...prev, data.url!]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="active" value={String(active)} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">
                  Nombre <span aria-hidden className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={product?.name}
                  placeholder="Ej: Reloj minimalista Nova"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={5}
                  defaultValue={product?.description}
                  placeholder="Describe el producto para usarlo en las landings"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imágenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((url) => (
                  <div
                    key={url}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                  >
                    <Image
                      src={url}
                      alt="Imagen del producto"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages((prev) => prev.filter((i) => i !== url))
                      }
                      aria-label="Quitar imagen"
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <ImagePlus className="h-5 w-5" aria-hidden />
                  )}
                  <span className="text-xs">
                    {uploading ? "Subiendo..." : "Agregar"}
                  </span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                JPG, PNG, WebP, AVIF o GIF · máximo 5 MB por imagen
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Precio e inventario</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price">
                  Precio <span aria-hidden className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={product?.price}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="compareAtPrice">Precio de comparación</Label>
                <Input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  defaultValue={product?.compareAtPrice ?? ""}
                  placeholder="Precio tachado (opcional)"
                />
                <p className="text-xs text-muted-foreground">
                  Se muestra tachado junto al precio real
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  defaultValue={product?.stock ?? 0}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  defaultValue={product?.sku ?? ""}
                  placeholder="Código interno (opcional)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="active-switch">Producto activo</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Solo los productos activos pueden usarse en landings
                  </p>
                </div>
                <Switch
                  id="active-switch"
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
        >
          Cancelar
        </Button>
        <SubmitButton isEdit={!!product} />
      </div>
    </form>
  );
}
