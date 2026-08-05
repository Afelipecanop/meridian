"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteProduct,
  toggleProductActive,
} from "@/app/admin/(shell)/products/actions";

export function ProductRowActions({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleProductActive(id, !active);
        toast.success(active ? "Producto desactivado" : "Producto activado");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo actualizar el producto",
        );
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProduct(id);
        toast.success("Producto eliminado");
        setConfirmOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo eliminar el producto",
        );
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Acciones para ${name}`}
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            render={<Link href={`/admin/products/${id}`} />}
            className="cursor-pointer"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleToggle}
            disabled={pending}
            className="cursor-pointer"
          >
            {active ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
            {active ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las landings que usen este
              producto quedarán sin producto asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
