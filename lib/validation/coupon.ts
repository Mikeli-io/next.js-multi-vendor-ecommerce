import * as z from "zod";

import { money, optionalMoney, toCents } from "./product";

/**
 * Vendor coupon rules (VendorCoupon design), shared by the form (instant
 * inline errors) and the Server Actions (the authoritative check). Never
 * inputs: vendorId (the session's store) and, on create, status (ACTIVE).
 * Money stays a decimal string, compared in integer cents.
 */

export const couponIdSchema = z.cuid({ error: "This coupon no longer exists." });

export const COUPON_TYPES = ["DISCOUNT_ON_PURCHASE", "FREE_DELIVERY", "FIRST_ORDER"] as const;
export type CouponTypeValue = (typeof COUPON_TYPES)[number];

export const COUPON_TYPE_LABEL: Record<CouponTypeValue, string> = {
  DISCOUNT_ON_PURCHASE: "Discount On Purchase",
  FREE_DELIVERY: "Free Delivery",
  FIRST_ORDER: "First Order",
};

/** Codes are stored upper-case: "summer-25" and "SUMMER-25" are one code. */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export const COUPON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{3,29}$/;

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

/** `YYYY-MM-DD` from a date input → a UTC-midnight Date. */
const dateField = (label: string) =>
  z
    .string({ error: `Choose the ${label}.` })
    .trim()
    .min(1, { error: `Choose the ${label}.` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: `Enter a valid ${label}.` })
    .transform((value) => new Date(`${value}T00:00:00Z`))
    .refine((date) => !Number.isNaN(date.getTime()), { error: `Enter a valid ${label}.` });

export const todayUtc = () => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
export const COUPON_EXPIRED = "The expire date can't be in the past.";

export const COUPON_APPLIES_TO = ["ALL_PRODUCTS", "SPECIFIC_PRODUCTS"] as const;
export type CouponAppliesToValue = (typeof COUPON_APPLIES_TO)[number];

export const COUPON_APPLIES_TO_LABEL: Record<CouponAppliesToValue, string> = {
  ALL_PRODUCTS: "All my products (store-wide)",
  SPECIFIC_PRODUCTS: "Specific products",
};

/** Upper bound on one coupon's product list (a request-size guard, not a business rule). */
export const COUPON_PRODUCTS_LIMIT = 1000;
export const COUPON_PRODUCTS_REQUIRED = "Choose at least one product.";

/**
 * Selected product ids as submitted (a JSON array). Ownership is NOT decided
 * here: the Server Action checks every id against the signed-in vendor.
 */
const productIdsSchema = z
  .array(z.cuid({ error: "A selected product is invalid." }), { error: "The selected products are invalid." })
  .max(COUPON_PRODUCTS_LIMIT, { error: `Choose at most ${COUPON_PRODUCTS_LIMIT} products.` });

export const couponFormSchema = z
  .object({
    type: z.enum(COUPON_TYPES, { error: "Choose a coupon type." }),
    title: z
      .string({ error: "Enter a coupon title." })
      .trim()
      .min(1, { error: "Enter a coupon title." })
      .min(2, { error: "Title must be at least 2 characters." })
      .max(100, { error: "Title must be 100 characters or fewer." }),
    code: z
      .string({ error: "Enter a coupon code." })
      .transform(normalizeCouponCode)
      .pipe(
        z
          .string()
          .min(1, { error: "Enter a coupon code." })
          .min(4, { error: "Code must be at least 4 characters." })
          .max(30, { error: "Code must be 30 characters or fewer." })
          .regex(COUPON_CODE_PATTERN, { error: "Use letters, numbers, dashes or underscores (no spaces)." }),
      ),
    limitPerUser: z
      .string({ error: "Enter the limit for the same user." })
      .trim()
      .min(1, { error: "Enter the limit for the same user." })
      .regex(/^\d{1,5}$/, { error: "Limit must be a whole number." })
      .transform(Number)
      .refine((n) => n >= 1 && n <= 10000, { error: "Limit must be between 1 and 10,000." }),
    discountType: z.enum(["AMOUNT", "PERCENTAGE"], { error: "Choose a discount type." }),
    discount: z.preprocess(blankToNull, money("discount amount").nullable()),
    maxDiscount: optionalMoney("maximum discount"),
    minPurchase: optionalMoney("minimum purchase"),
    startDate: dateField("start date"),
    expireDate: dateField("expire date"),
    appliesTo: z.enum(COUPON_APPLIES_TO, { error: "Choose what the coupon applies to." }),
    productIds: productIdsSchema,
  })
  .superRefine((d, ctx) => {
    if (d.appliesTo === "SPECIFIC_PRODUCTS" && d.productIds.length === 0) {
      ctx.addIssue({ code: "custom", message: COUPON_PRODUCTS_REQUIRED, path: ["productIds"] });
    }
    if (d.expireDate < d.startDate) {
      ctx.addIssue({ code: "custom", message: "The expire date can't be before the start date.", path: ["expireDate"] });
    }
    if (d.type === "FREE_DELIVERY") return;
    if (d.discount === null) {
      ctx.addIssue({ code: "custom", message: "Enter the discount amount.", path: ["discount"] });
      return;
    }
    if (toCents(d.discount) <= 0) {
      ctx.addIssue({ code: "custom", message: "The discount must be more than 0.", path: ["discount"] });
    }
    if (d.discountType === "PERCENTAGE" && toCents(d.discount) > 10000) {
      ctx.addIssue({ code: "custom", message: "A percentage discount can't be more than 100%.", path: ["discount"] });
    }
    if (d.discountType === "PERCENTAGE" && d.maxDiscount !== null && toCents(d.maxDiscount) <= 0) {
      ctx.addIssue({ code: "custom", message: "The maximum discount must be more than 0.", path: ["maxDiscount"] });
    }
  })
  // Store only what applies: free delivery has no discount; only a percentage has a cap.
  .transform((d) => ({
    ...d,
    discountType: d.type === "FREE_DELIVERY" ? null : d.discountType,
    discount: d.type === "FREE_DELIVERY" ? null : d.discount,
    maxDiscount: d.type !== "FREE_DELIVERY" && d.discountType === "PERCENTAGE" ? d.maxDiscount : null,
    minPurchase: d.minPurchase ?? "0.00",
    // Store-wide coupons have no product links; a repeated id counts once.
    productIds: d.appliesTo === "SPECIFIC_PRODUCTS" ? [...new Set(d.productIds)] : [],
  }));

export type CouponFormInput = z.input<typeof couponFormSchema>;
export type CouponFormValues = z.output<typeof couponFormSchema>;

export const couponListParamsSchema = z.object({
  q: z.string().trim().max(60).catch(""),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
});

export type CouponListParams = z.infer<typeof couponListParamsSchema>;
