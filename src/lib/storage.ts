import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/**
 * Guarda un archivo y devuelve su URL pública.
 * - Con `BLOB_READ_WRITE_TOKEN` (Vercel) usa Vercel Blob.
 * - Sin token (desarrollo local) escribe en `public/uploads/`.
 * La firma es estable: el resto de la app no distingue el backend.
 */
export async function saveFile(
  buffer: Buffer,
  extension: string,
): Promise<{ url: string; filename: string }> {
  const filename = `${randomUUID()}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, buffer, {
      access: "public",
      contentType: CONTENT_TYPES[extension] ?? "application/octet-stream",
      addRandomSuffix: false,
    });
    return { url: blob.url, filename };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/uploads/${filename}`, filename };
}
