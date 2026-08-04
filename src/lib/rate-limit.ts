/**
 * Rate-limit en memoria por clave (ventana deslizante). Suficiente para una
 * sola instancia; si la plataforma escala horizontalmente, cambiar por una
 * solución compartida (Upstash/Redis) manteniendo esta firma.
 */

const hits = new Map<string, number[]>();

const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return { ok: false, remaining: 0 };
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Evita crecimiento sin límite del mapa.
  if (hits.size > MAX_KEYS) {
    for (const [k, ts] of hits) {
      if (ts.every((t) => t <= windowStart)) hits.delete(k);
      if (hits.size <= MAX_KEYS / 2) break;
    }
  }

  return { ok: true, remaining: limit - timestamps.length };
}
