"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
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
  archiveLanding,
  deleteLanding,
  duplicateLanding,
  restoreLanding,
} from "@/app/admin/landings/actions";

export function LandingRowActions({
  id,
  name,
  slug,
  status,
}: {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDuplicate() {
    startTransition(async () => {
      try {
        await duplicateLanding(id);
        toast.success("Landing duplicada como borrador");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo duplicar la landing",
        );
      }
    });
  }

  function handleArchiveToggle() {
    startTransition(async () => {
      try {
        if (status === "archived") {
          await restoreLanding(id);
          toast.success("Landing restaurada como borrador");
        } else {
          await archiveLanding(id);
          toast.success("Landing archivada (ya no es pública)");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo actualizar la landing",
        );
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteLanding(id);
        toast.success("Landing eliminada");
        setConfirmOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo eliminar la landing",
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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            render={<Link href={`/admin/landings/${id}/editor`} />}
            className="cursor-pointer"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Abrir editor
          </DropdownMenuItem>
          {status === "published" && (
            <DropdownMenuItem
              render={<a href={`/${slug}`} target="_blank" rel="noreferrer" />}
              className="cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ver página
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={handleDuplicate}
            disabled={pending}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4" aria-hidden />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleArchiveToggle}
            disabled={pending}
            className="cursor-pointer"
          >
            {status === "archived" ? (
              <ArchiveRestore className="h-4 w-4" aria-hidden />
            ) : (
              <Archive className="h-4 w-4" aria-hidden />
            )}
            {status === "archived" ? "Restaurar" : "Archivar"}
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
              Esta acción no se puede deshacer. Si la landing está publicada,
              /{slug} dejará de existir. Los pedidos asociados se conservan.
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
