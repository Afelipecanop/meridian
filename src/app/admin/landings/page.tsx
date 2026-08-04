import type { Metadata } from "next";
import { Layers } from "lucide-react";

export const metadata: Metadata = { title: "Landings" };

export default function LandingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Landings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus páginas de producto
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <Layers className="h-6 w-6 text-muted-foreground" aria-hidden />
        </span>
        <div>
          <p className="font-medium">El editor de landings llega pronto</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Se construye en la Etapa 3 y 4 del plan
          </p>
        </div>
      </div>
    </div>
  );
}
