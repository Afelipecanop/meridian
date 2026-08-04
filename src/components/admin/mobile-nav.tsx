"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
          />
        }
      >
        <Menu className="h-5 w-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 border-border bg-sidebar p-0">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle
            render={
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5"
              />
            }
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Compass className="h-4 w-4 text-primary" aria-hidden />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Meridian
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="px-3 py-4">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
