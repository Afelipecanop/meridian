import { sanitizeCustomHtml } from "@/lib/sanitize";
import type { CustomHtmlSettings } from "@/lib/zod-schemas/sections";
import type { SectionProps } from "./types";

export function CustomHtmlSection({
  settings,
}: SectionProps<CustomHtmlSettings>) {
  if (!settings.html.trim()) return null;

  return (
    <section className="px-6 py-12">
      <div
        className="mx-auto max-w-2xl [&_a]:text-(--lp-primary) [&_a]:underline [&_h2]:mt-6 [&_h2]:font-(family-name:--font-display) [&_h2]:text-2xl [&_h2]:font-medium [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:rounded-2xl [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_p]:text-(--lp-text)/70 [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: sanitizeCustomHtml(settings.html) }}
      />
    </section>
  );
}
