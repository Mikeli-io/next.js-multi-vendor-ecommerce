import * as z from "zod";

/** The five Admin Product Management lists. */
export const ADMIN_PRODUCT_VIEWS = ["pending", "approved", "rejected", "featured", "popular"] as const;
export type AdminProductView = (typeof ADMIN_PRODUCT_VIEWS)[number];

export const adminProductListParamsSchema = z.object({
  q: z.string().trim().max(80).catch(""),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
});
export type AdminProductListParams = z.infer<typeof adminProductListParamsSchema>;

/** What the admin may set the approval to (never back to PENDING). */
export const approvalDecisionSchema = z.enum(["APPROVED", "REJECTED"], { error: "That decision isn't available." });

export const merchandisingFlagSchema = z.enum(["featured", "popular"], { error: "Unknown setting." });
export type MerchandisingFlag = z.infer<typeof merchandisingFlagSchema>;
