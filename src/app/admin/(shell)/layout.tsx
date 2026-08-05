import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { auth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { MobileNav } from "@/components/admin/mobile-nav";
import { UserMenu } from "@/components/admin/user-menu";
import { DesktopOnlyNotice } from "@/components/admin/desktop-only-notice";

export const metadata: Metadata = {
  title: {
    default: "Admin — Meridian",
    template: "%s — Meridian",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="dark">
      <div className="lg:hidden">
        <DesktopOnlyNotice />
      </div>
      <div className="hidden min-h-dvh bg-background text-foreground lg:block">
        {/* Sidebar de escritorio */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
          <div className="flex h-14 items-center border-b border-border px-5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Compass className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                Meridian
              </span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav />
          </div>
        </aside>

        {/* Contenido */}
        <div className="lg:pl-60">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
            <MobileNav />
            <div className="flex-1" />
            <UserMenu
              email={session?.user?.email ?? ""}
              name={session?.user?.name ?? "Admin"}
            />
          </header>
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
