import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP básica: bloquea scripts de orígenes no listados (solo los píxeles
 * soportados), impide que el sitio sea embebido por terceros
 * (frame-ancestors 'self' mantiene funcionando el preview del editor)
 * y restringe formularios al propio origen. Solo en producción: el dev
 * server de Next necesita eval/inline sin restricciones.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://analytics.tiktok.com https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Evita que Turbopack/file-tracing infieran una raíz equivocada por
  // lockfiles fuera del repo.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,

  images: {
    // El editor admite URLs de imagen arbitrarias (https) además de las
    // subidas a Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Las imágenes demo del seed son SVG; se sirven con sandbox.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
  },

  async headers() {
    if (!isProd) return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
