import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Almacenamiento local para desarrollo. En la Etapa 7 (producción)
// esta función se reemplaza por Vercel Blob manteniendo la misma firma.
export async function saveFile(
  buffer: Buffer,
  extension: string,
): Promise<{ url: string; filename: string }> {
  const filename = `${randomUUID()}.${extension}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/uploads/${filename}`, filename };
}
