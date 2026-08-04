import sanitizeHtml from "sanitize-html";

/**
 * Sanitiza el HTML de la sección "HTML personalizado" antes de renderizarlo
 * (y, desde la Etapa 4, antes de guardarlo). No se permiten <script> ni
 * iframes: los píxeles de seguimiento van por el campo dedicado `pixels`.
 */
export function sanitizeCustomHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "a", "b", "strong", "i", "em", "u", "s", "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "span", "div",
      "img", "figure", "figcaption", "video", "source",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      "*": ["class", "style", "id"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      video: ["src", "poster", "controls", "muted", "loop", "playsinline", "width", "height"],
      source: ["src", "type"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
