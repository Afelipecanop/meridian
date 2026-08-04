import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";

export const metadata: Metadata = { title: "Pedidos" };

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos recibidos desde tus landings
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <ShoppingCart
            className="h-6 w-6 text-muted-foreground"
            aria-hidden
          />
        </span>
        <div>
          <p className="font-medium">Aún no hay pedidos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            La gestión de pedidos se construye en la Etapa 5 del plan
          </p>
        </div>
      </div>
    </div>
  );
}
