import {
  Check,
  Clock,
  Heart,
  Leaf,
  Package,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { BenefitsSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

/** Íconos elegibles desde el editor por nombre. */
const icons: Record<string, LucideIcon> = {
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
};

export function BenefitsSection({ settings }: SectionProps<BenefitsSettings>) {
  if (settings.items.length === 0) return null;

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-5xl">
        {settings.title ? (
          <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
            {settings.title}
          </h2>
        ) : null}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {settings.items.map((item, i) => {
            const Icon = icons[item.icon] ?? Check;
            return (
              <div key={i} className="flex flex-col items-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--lp-primary)/10">
                  <Icon className="h-6 w-6 text-(--lp-primary)" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                {item.description ? (
                  <p className="mt-1 text-sm text-(--lp-text)/70">
                    {item.description}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
