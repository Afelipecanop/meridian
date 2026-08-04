/** Slugs que colisionarían con rutas propias de la plataforma. */
export const RESERVED_SLUGS = [
  "admin",
  "login",
  "api",
  "preview",
  "uploads",
  "demo",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
];

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function validateSlug(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) {
    return "El slug solo puede tener minúsculas, números y guiones";
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return "Ese slug está reservado por la plataforma";
  }
  return null;
}
