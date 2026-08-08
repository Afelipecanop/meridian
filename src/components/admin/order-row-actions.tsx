"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteOrder } from "@/app/admin/(shell)/orders/actions";

export function OrderRowActions({
  id,
  redirectOnDelete,
}: {
  id: string;
  /** Si se borra desde el detalle del pedido, vuelve a la lista. */
  redirectOnDelete?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteOrder(id);
        toast.success("Pedido eliminado");
        setConfirmOpen(false);
        if (redirectOnDelete) router.push("/admin/orders");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo eliminar el pedido",
        );
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Eliminar pedido #${id.slice(0, 8)}`}
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar pedido #{id.slice(0, 8)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el pedido y todo
              su historial de eventos.
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
