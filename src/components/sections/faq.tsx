import { ChevronDown } from "lucide-react";
import type { FaqSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

export function FaqSection({ settings }: SectionProps<FaqSettings>) {
  if (settings.items.length === 0) return null;

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-3xl">
        {settings.title ? (
          <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
            {settings.title}
          </h2>
        ) : null}
        <div className="mt-8 divide-y divide-(--lp-text)/10 rounded-xl border border-(--lp-text)/10">
          {settings.items.map((item, i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-(--lp-text)/50 transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm text-(--lp-text)/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
