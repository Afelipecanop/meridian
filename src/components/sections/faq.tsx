"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

export function FaqSection({ settings }: SectionProps<FaqSettings>) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (settings.items.length === 0) return null;

  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        {settings.title ? (
          <h2 className="font-(family-name:--font-display) text-[28px] font-medium tracking-tight text-balance">
            {settings.title}
          </h2>
        ) : null}
        <div className="mt-6 divide-y divide-(--lp-text)/10 border-t border-(--lp-text)/10">
          {settings.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-4.5 text-left text-[15.5px] font-semibold"
                >
                  {item.question}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-(--lp-text)/50 transition-transform duration-250 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <div
                  id={`faq-answer-${i}`}
                  className={`lp-faq-a ${isOpen ? "is-open" : ""}`}
                >
                  <div>
                    <p className="pb-4.5 text-[14.5px] text-(--lp-text)/70">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
