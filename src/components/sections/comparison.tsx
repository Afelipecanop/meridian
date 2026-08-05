import type { ComparisonSettings } from "@/lib/zod-schemas/sections";
import { Reveal } from "./reveal";
import type { SectionProps } from "./types";

export function ComparisonSection({ settings }: SectionProps<ComparisonSettings>) {
  if (settings.rows.length === 0) return null;

  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-xl">
        {settings.eyebrow ? (
          <span className="text-xs font-semibold tracking-wide text-(--lp-primary) uppercase">
            {settings.eyebrow}
          </span>
        ) : null}
        <h2 className="mt-3 font-(family-name:--font-display) text-[28px] font-medium tracking-tight text-balance">
          {settings.title}
        </h2>

        <Reveal className="mt-6 overflow-hidden rounded-2xl border border-(--lp-text)/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-(--lp-text)/[0.04]">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-(--lp-text)/70">
                  Característica
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-(--lp-primary)">
                  {settings.ourLabel}
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-(--lp-text)/50">
                  {settings.otherLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {settings.rows.map((row, i) => (
                <tr
                  key={i}
                  className={i < settings.rows.length - 1 ? "border-b border-(--lp-text)/10" : ""}
                >
                  <td className="px-4 py-3.5">{row.feature}</td>
                  <td className="px-4 py-3.5 font-semibold text-(--lp-primary)">
                    {row.ours}
                  </td>
                  <td className="px-4 py-3.5 text-(--lp-text)/50">{row.other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        {settings.note ? (
          <p className="mt-2.5 text-xs text-(--lp-text)/50">{settings.note}</p>
        ) : null}
      </div>
    </section>
  );
}
