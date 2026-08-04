"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CircleDollarSign } from "lucide-react";
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
import { PaymentBadge, type PaymentMethod, type PaymentStatus } from "@/components/admin/order-status";
import { markOrderPaid } from "@/app/admin/(shell)/orders/actions";

/**
 * Pasarela: el webhook es la única vía que cambia payment_status, así que
 * aquí solo se muestra el badge de solo lectura. Contra entrega: se permite
 * marcar el pago a mano cuando el repartidor cobra (única excepción al
 * webhook, y solo para este método).
 */
export function PaymentStatusControl({
  orderId,
  method,
  status,
}: {
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (method !== "cod") {
    return (
      <div className="flex flex-col items-end gap-1">
        <PaymentBadge method={method} status={status} />
        <span className="text-[11px] text-muted-foreground">
          Solo lectura: lo actualiza el webhook de la pasarela
        </span>
      </div>
    );
  }

  if (status === "paid") {
    return <PaymentBadge method={method} status={status} />;
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await markOrderPaid(orderId);
      if (result.success) {
        toast.success("Pago marcado como recibido");
        setConfirmOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <PaymentBadge method={method} status={status} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          <CircleDollarSign className="h-3.5 w-3.5" aria-hidden />
          Marcar pagado
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar pedido como pagado?</AlertDialogTitle>
            <AlertDialogDescription>
              Úsalo cuando el repartidor confirme que cobró el contra entrega.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={pending}
            >
              {pending ? "Guardando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
