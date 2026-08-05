import { Check } from "lucide-react";
import type { TrustBarSettings } from "@/lib/zod-schemas/sections";
import { sectionIcons } from "./icons";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

export function TrustBarSection({ settings }: SectionProps<TrustBarSettings>) {
  if (settings.items.length === 0) return null;

  return (
    <div className="border-y border-(--lp-text)/10 bg-(--lp-text)/[0.02] px-6 py-6">
      <Reveal stagger className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {settings.items.map((item, i) => {
          const Icon = sectionIcons[item.icon] ?? Check;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 text-sm font-medium text-(--lp-text)/80"
            >
              <Icon className="h-[18px] w-[18px] shrink-0 text-(--lp-primary)" aria-hidden />
              <span>{item.text}</span>
            </div>
          );
        })}
      </Reveal>
    </div>
  );
}
