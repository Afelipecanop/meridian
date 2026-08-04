import { Badge } from "@/components/ui/badge";
import type { Order } from "@/db/schema";

export type OrderStatus = Order["status"];

export const orderStatusLabels: Record<OrderStatus, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const badgeClasses: Record<OrderStatus, string> = {
  nuevo: "bg-sky-500/15 text-sky-400",
  confirmado: "bg-indigo-500/15 text-indigo-400",
  enviado: "bg-amber-500/15 text-amber-400",
  entregado: "bg-emerald-500/15 text-emerald-400",
  cancelado: "bg-red-500/15 text-red-400",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={badgeClasses[status]}>{orderStatusLabels[status]}</Badge>
  );
}

type PaymentMethod = Order["paymentMethod"];
type PaymentStatus = Order["paymentStatus"];

const paymentBadges: Record<PaymentStatus, { label: string; className: string }> =
  {
    na: { label: "—", className: "bg-white/5 text-muted-foreground" },
    pending: { label: "Pago pendiente", className: "bg-amber-500/15 text-amber-400" },
    paid: { label: "Pagado", className: "bg-emerald-500/15 text-emerald-400" },
    failed: { label: "Pago fallido", className: "bg-red-500/15 text-red-400" },
  };

export function PaymentBadge({
  method,
  status,
}: {
  method: PaymentMethod;
  status: PaymentStatus;
}) {
  if (method === "cod") {
    return (
      <span className="text-xs text-muted-foreground">Contra entrega</span>
    );
  }
  const badge = paymentBadges[status];
  return <Badge className={badge.className}>{badge.label}</Badge>;
}
