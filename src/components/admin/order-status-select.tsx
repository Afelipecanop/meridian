"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  const [pending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (result.success) {
        toast.success(
          `Estado actualizado a ${orderStatusLabels[next as OrderStatus]}`,
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
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
  );
}
