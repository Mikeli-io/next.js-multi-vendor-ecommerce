import * as z from "zod";

/**
 * Upload rules shared by every admin image field (brands, categories). The
 * MIME type checked here is the browser's claim; the server also sniffs the
 * file's actual bytes before storing it (see lib/uploads/images.ts).
 */

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

/**
 * Optional image. An empty file input submits a zero-byte File, which means
 * "no new image" — on edit, that keeps the current one.
 */
export const optionalImageSchema = z.preprocess(
  (value) =>
    value == null || value === "" || (value instanceof File && value.size === 0)
      ? undefined
      : value,
  z
    .instanceof(File, { error: "Upload an image file." })
    .refine((file) => file.size <= IMAGE_MAX_BYTES, {
      error: "Image must be 2 MB or smaller.",
    })
    .refine((file) => (IMAGE_TYPES as readonly string[]).includes(file.type), {
      error: "Use a JPG, PNG or WebP image.",
    })
    .optional(),
);
