import * as z from "zod";

import { optionalImageSchema } from "./image";

/**
 * Brand form rules, shared by the client (instant inline errors) and the
 * Server Actions (the authoritative check). Slug and product count are not
 * here on purpose: both are derived on the server, never accepted as input.
 */

export const BRAND_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type BrandStatusValue = (typeof BRAND_STATUSES)[number];

const name = z
  .string({ error: "Enter a brand name." })
  .trim()
  .min(2, { error: "Brand name must be at least 2 characters." })
  .max(60, { error: "Brand name must be 60 characters or fewer." });

export const brandStatusSchema = z.enum(BRAND_STATUSES, {
  error: "Choose Active or Inactive.",
});

export const brandFormSchema = z.object({
  name,
  status: brandStatusSchema,
  image: optionalImageSchema,
});

export type BrandFormInput = z.infer<typeof brandFormSchema>;

/** Brand ids are Prisma cuids; reject anything else before touching the DB. */
export const brandIdSchema = z.cuid({ error: "Invalid brand." });

/** List filters read from the URL. Unknown values fall back to "all". */
export const brandListParamsSchema = z.object({
  q: z.string().trim().max(60).catch(""),
  status: z.enum(["all", "active", "inactive"]).catch("all"),
});

export type BrandListParams = z.infer<typeof brandListParamsSchema>;
