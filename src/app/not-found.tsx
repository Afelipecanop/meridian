import { Compass } from "lucide-react";
import { EmptyStateScreen } from "@/components/empty-state-screen";

export default function NotFound() {
  return (
    <EmptyStateScreen
      icon={Compass}
      eyebrow="Error 404"
      title="Esta página no existe o ya no está publicada"
      description="Puede que el enlace esté roto o que la landing haya sido despublicada. Vuelve al inicio para seguir explorando."
      action={{ href: "/", label: "Ir al inicio" }}
    />
  );
}
