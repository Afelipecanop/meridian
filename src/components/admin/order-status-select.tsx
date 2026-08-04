"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  orderStatusLabels,
  type OrderStatus,
} from "@/components/admin/order-status";
import { updateOrderStatus } from "@/app/admin/(shell)/orders/actions";

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pendingValue, setPendingValue] = useState<OrderStatus | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    const next = pendingValue;
    if (!next) return;
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (result.success) {
        toast.success(`Estado actualizado a ${orderStatusLabels[next]}`);
      } else {
        toast.error(result.error);
      }
      setPendingValue(null);
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={status}
          disabled={pending}
          onChange={(e) => setPendingValue(e.target.value as OrderStatus)}
          aria-label="Estado del pedido"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {pending && (
          <Loader2
            className="h-4 w-4 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      <AlertDialog
        open={pendingValue !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setPendingValue(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar estado del pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValue
                ? `Vas a cambiar el estado de "${orderStatusLabels[status]}" a "${orderStatusLabels[pendingValue]}".`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={pending}
              onClick={() => setPendingValue(null)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirm();
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
