import { Badge } from "@/components/ui/badge";
import type { Order } from "@/db/schema";

export type OrderStatus = Order["status"];

export const orderStatusLabels: Record<OrderStatus, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  despachado: "Despachado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  devuelto: "Devuelto",
};

const badgeClasses: Record<OrderStatus, string> = {
  nuevo: "bg-sky-500/15 text-sky-400",
  confirmado: "bg-indigo-500/15 text-indigo-400",
  en_preparacion: "bg-violet-500/15 text-violet-400",
  despachado: "bg-amber-500/15 text-amber-400",
  entregado: "bg-emerald-500/15 text-emerald-400",
  cancelado: "bg-red-500/15 text-red-400",
  devuelto: "bg-orange-500/15 text-orange-400",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={badgeClasses[status]}>{orderStatusLabels[status]}</Badge>
  );
}

export type PaymentMethod = Order["paymentMethod"];
export type PaymentStatus = Order["paymentStatus"];

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  na: "N/A",
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
};

const paymentBadges: Record<PaymentStatus, { label: string; className: string }> =
  {
    na: { label: "—", className: "bg-white/5 text-muted-foreground" },
    pending: { label: "Pago pendiente", className: "bg-amber-500/15 text-amber-400" },
    paid: { label: "Pagado", className: "bg-emerald-500/15 text-emerald-400" },
    failed: { label: "Pago fallido", className: "bg-red-500/15 text-red-400" },
  };

/**
 * Contra entrega sin marcar como pagado se muestra como texto plano (nunca
 * tuvo un "estado de pago" real); en cualquier otro caso —incluido COD ya
 * marcado como pagado a mano— se usa el badge normal según payment_status.
 */
export function PaymentBadge({
  method,
  status,
}: {
  method: PaymentMethod;
  status: PaymentStatus;
}) {
  if (method === "cod" && status !== "paid") {
    return (
      <span className="text-xs text-muted-foreground">Contra entrega</span>
    );
  }
  const badge = paymentBadges[status];
  return <Badge className={badge.className}>{badge.label}</Badge>;
}
