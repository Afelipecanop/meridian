import {
  BadgeCheck,
  Check,
  Clock,
  CreditCard,
  Gem,
  Heart,
  Leaf,
  Package,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Íconos elegibles desde el editor por nombre, compartidos por las secciones
 * benefits, trust-bar y quality.
 */
export const sectionIcons: Record<string, LucideIcon> = {
  check: Check,
  clock: Clock,
  heart: Heart,
  leaf: Leaf,
  package: Package,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  "thumbs-up": ThumbsUp,
  truck: Truck,
  zap: Zap,
  "rotate-ccw": RotateCcw,
  users: Users,
  "credit-card": CreditCard,
  "badge-check": BadgeCheck,
  gem: Gem,
};

export const sectionIconOptions = [
  { value: "check", label: "Check" },
  { value: "clock", label: "Reloj" },
  { value: "heart", label: "Corazón" },
  { value: "leaf", label: "Hoja" },
  { value: "package", label: "Paquete" },
  { value: "shield", label: "Escudo" },
  { value: "sparkles", label: "Destellos" },
  { value: "star", label: "Estrella" },
  { value: "thumbs-up", label: "Pulgar arriba" },
  { value: "truck", label: "Camión" },
  { value: "zap", label: "Rayo" },
  { value: "rotate-ccw", label: "Devolución" },
  { value: "users", label: "Personas" },
  { value: "credit-card", label: "Tarjeta de pago" },
  { value: "badge-check", label: "Insignia verificada" },
  { value: "gem", label: "Gema" },
];
