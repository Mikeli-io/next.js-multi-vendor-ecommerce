import * as z from "zod";

/**
 * Brand form rules, shared by the client (instant inline errors) and the
 * Server Actions (the authoritative check). Slug and product count are not
 * here on purpose: both are derived on the server, never accepted as input.
 */

export const BRAND_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type BrandStatusValue = (typeof BRAND_STATUSES)[number];

export const BRAND_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const BRAND_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const BRAND_IMAGE_ACCEPT = BRAND_IMAGE_TYPES.join(",");

const name = z
  .string({ error: "Enter a brand name." })
  .trim()
  .min(2, { error: "Brand name must be at least 2 characters." })
  .max(60, { error: "Brand name must be 60 characters or fewer." });

export const brandStatusSchema = z.enum(BRAND_STATUSES, {
  error: "Choose Active or Inactive.",
});

/**
 * Optional image. An empty file input submits a zero-byte File, which means
 * "no new image" — on edit, that keeps the current one.
 *
 * The MIME type checked here is the browser's claim; the server additionally
 * sniffs the file's actual bytes before storing it (see lib/uploads).
 */
const image = z.preprocess(
  (value) =>
    value == null || value === "" || (value instanceof File && value.size === 0)
      ? undefined
      : value,
  z
    .instanceof(File, { error: "Upload an image file." })
    .refine((file) => file.size <= BRAND_IMAGE_MAX_BYTES, {
      error: "Image must be 2 MB or smaller.",
    })
    .refine(
      (file) => (BRAND_IMAGE_TYPES as readonly string[]).includes(file.type),
      { error: "Use a JPG, PNG or WebP image." },
    )
    .optional(),
);

export const brandFormSchema = z.object({ name, status: brandStatusSchema, image });

export type BrandFormInput = z.infer<typeof brandFormSchema>;

/** Brand ids are Prisma cuids; reject anything else before touching the DB. */
export const brandIdSchema = z.cuid({ error: "Invalid brand." });

/** List filters read from the URL. Unknown values fall back to "all". */
export const brandListParamsSchema = z.object({
  q: z.string().trim().max(60).catch(""),
  status: z.enum(["all", "active", "inactive"]).catch("all"),
});

export type BrandListParams = z.infer<typeof brandListParamsSchema>;
