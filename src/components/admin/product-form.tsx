"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
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
import type { Product, ProductVariantGroup } from "@/db/schema";
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
  const [imageUrl, setImageUrl] = useState("");
  const [variants, setVariants] = useState<ProductVariantGroup[]>(
    product?.variants ?? [],
  );
  const [groupName, setGroupName] = useState("");
  const [groupOptions, setGroupOptions] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success(product ? "Producto actualizado" : "Producto creado");
      router.push("/admin/products");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, product, router]);

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("Ingresa una URL de imagen válida");
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrl("");
  }

  function addVariantGroup() {
    const name = groupName.trim();
    const options = groupOptions
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);
    if (!name) {
      toast.error("Ingresa un nombre para la variable");
      return;
    }
    if (options.length === 0) {
      toast.error("Ingresa al menos una opción");
      return;
    }
    setVariants((prev) => [...prev, { name, options }]);
    setGroupName("");
    setGroupOptions("");
  }

  function removeVariantGroup(groupIndex: number) {
    setVariants((prev) => prev.filter((_, i) => i !== groupIndex));
  }

  function removeVariantOption(groupIndex: number, optionIndex: number) {
    setVariants((prev) =>
      prev
        .map((group, i) =>
          i === groupIndex
            ? {
                ...group,
                options: group.options.filter((_, oi) => oi !== optionIndex),
              }
            : group,
        )
        .filter((group) => group.options.length > 0),
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="active" value={String(active)} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

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
              <div className="flex gap-2">
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addImageUrl}>
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  Agregar
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Pega la URL de la imagen y presiona Agregar. Puedes agregar
                tantas como quieras para formar el carrete del producto.
              </p>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
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
                          setImages((prev) => prev.filter((_, i) => i !== index))
                        }
                        aria-label="Quitar imagen"
                        className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Nombre (ej: Talla)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="sm:flex-1"
                />
                <Input
                  placeholder="Opciones separadas por coma (ej: S, M, L)"
                  value={groupOptions}
                  onChange={(e) => setGroupOptions(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addVariantGroup();
                    }
                  }}
                  className="sm:flex-[2]"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addVariantGroup}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Agregar
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Opcional. Si el producto viene en distintos tamaños, colores o
                sabores, agrégalos aquí — aparecerán como selección
                obligatoria en el formulario de pedido. Si no agregas
                ninguno, esa sección no se mostrará.
              </p>

              {variants.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  {variants.map((group, groupIndex) => (
                    <div
                      key={`${group.name}-${groupIndex}`}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {group.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVariantGroup(groupIndex)}
                          aria-label={`Quitar variable ${group.name}`}
                          className="cursor-pointer text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {group.options.map((option, optionIndex) => (
                          <span
                            key={`${option}-${optionIndex}`}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs"
                          >
                            {option}
                            <button
                              type="button"
                              onClick={() =>
                                removeVariantOption(groupIndex, optionIndex)
                              }
                              aria-label={`Quitar opción ${option}`}
                              className="cursor-pointer text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <X className="h-3 w-3" aria-hidden />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
