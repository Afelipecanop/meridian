import { Monitor } from "lucide-react";
import { EmptyStateScreen } from "@/components/empty-state-screen";

export function DesktopOnlyNotice() {
  return (
    <EmptyStateScreen
      icon={Monitor}
      eyebrow="Solo disponible en computador"
      title="Este panel no está disponible en este dispositivo"
      description="El panel de administración de Meridian está optimizado para pantallas grandes. Ingresa desde un computador para continuar."
      action={{ href: "/login", label: "Volver al inicio de sesión" }}
      showDeviceHint
    />
  );
}
