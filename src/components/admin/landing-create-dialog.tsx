"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/slug";
import { createLanding } from "@/app/admin/landings/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-w-36">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? "Creando..." : "Crear y abrir editor"}
    </Button>
  );
}

export function LandingCreateDialog({
  products,
}: {
  products: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createLanding, undefined);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setSlug("");
      setSlugTouched(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" aria-hidden />
        Nueva landing
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva landing</DialogTitle>
          <DialogDescription>
            Se crea como borrador con una plantilla base y se abre en el editor.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="landing-name">
              Nombre <span aria-hidden className="text-destructive">*</span>
            </Label>
            <Input
              id="landing-name"
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Ej: Botella Aurora"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="landing-slug">Slug (URL)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="landing-slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                onBlur={() => setSlug((s) => slugify(s))}
                placeholder="botella-aurora"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="landing-product">Producto</Label>
            <select
              id="landing-product"
              name="productId"
              defaultValue=""
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sin producto (elegir después)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
