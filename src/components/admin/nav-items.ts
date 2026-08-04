import {
  LayoutDashboard,
  Layers,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Landings", href: "/admin/landings", icon: Layers },
  { title: "Productos", href: "/admin/products", icon: Package },
  { title: "Pedidos", href: "/admin/orders", icon: ShoppingCart },
];
