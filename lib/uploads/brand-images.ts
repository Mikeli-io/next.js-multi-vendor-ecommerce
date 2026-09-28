import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { BRAND_IMAGE_MAX_BYTES } from "@/lib/validation/brand";

/**
 * DEVELOPMENT-STAGE STORAGE.
 *
 * Brand images are written to `public/uploads/brands/` on the local disk and
 * served as static files. That only works on a single long-lived server with a
 * persistent filesystem — not on serverless or multi-instance hosting.
 *
 * TODO(storage): replace with persistent object storage (S3 / Cloudflare R2)
 * before production. Keep this module's interface (`saveBrandImage`,
 * `removeBrandImage`) so callers do not change.
 */

const PUBLIC_PREFIX = "/uploads/brands/";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "brands");

type Detected = { ext: "jpg" | "png" | "webp" };

/**
 * Identify the image by its leading bytes rather than trusting the file name
 * or the browser-reported MIME type, either of which a client can fake.
 */
function sniffImage(bytes: Uint8Array): Detected | null {
  const starts = (sig: number[], offset = 0) =>
    sig.every((b, i) => bytes[offset + i] === b);

  if (starts([0xff, 0xd8, 0xff])) return { ext: "jpg" };
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ext: "png" };
  // "RIFF" .... "WEBP"
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) {
    return { ext: "webp" };
  }
  return null;
}

export class InvalidImageError extends Error {}

/**
 * Validate and store an uploaded brand image. Returns its public URL path.
 * The stored name is a fresh UUID — the original file name is never used.
 */
export async function saveBrandImage(file: File): Promise<string> {
  if (file.size > BRAND_IMAGE_MAX_BYTES) {
    throw new InvalidImageError("Image must be 2 MB or smaller.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = sniffImage(bytes);
  if (!detected) {
    throw new InvalidImageError("That file isn't a valid JPG, PNG or WebP image.");
  }

  const fileName = `${randomUUID()}.${detected.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, fileName), bytes);

  return `${PUBLIC_PREFIX}${fileName}`;
}

/**
 * Delete a previously stored brand image. Anything that does not resolve to a
 * file directly inside the brand upload folder is ignored, so a crafted path
 * can never remove other files. Missing files are not an error.
 */
export async function removeBrandImage(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath?.startsWith(PUBLIC_PREFIX)) return;

  const target = path.resolve(UPLOAD_DIR, publicPath.slice(PUBLIC_PREFIX.length));
  if (path.dirname(target) !== UPLOAD_DIR) return;

  try {
    await unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("removeBrandImage: could not delete", publicPath, error);
    }
  }
}
