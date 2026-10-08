import * as z from "zod";

import { VARIATION_LIMITS, combinations, comboKey, groupProblems, type Attributes } from "@/lib/products/variations";

/**
 * Product form rules, shared by the client form (instant inline errors) and
 * the Server Actions (the authoritative check). Never inputs: vendorId,
 * approvalStatus, isActive, slug — the server sets those.
 *
 * Money stays a decimal *string* end to end ("12.50"): it is checked with a
 * pattern and compared in integer cents, and Prisma stores it into
 * DECIMAL(10,2) exactly — no floating-point arithmetic is the source of truth.
 */

export const productIdSchema = z.cuid({ error: "This product no longer exists." });

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

/**
 * "1234.5" → 123450 cents. Only call on values that passed `MONEY`/`PERCENT`.
 * Integer cents (at most ~10^10) are exact in a JS number; nothing here is
 * ever a fractional float.
 */
export function toCents(value: string): number {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

const MONEY = /^\d{1,8}(\.\d{1,2})?$/; // DECIMAL(10,2): up to 99,999,999.99
const PERCENT = /^\d{1,3}(\.\d{1,2})?$/;

/** Normalize "12.5" → "12.50" for storage and display. */
export function normalizeMoney(value: string): string {
  const cents = toCents(value);
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

const money = (label: string) =>
  z
    .string({ error: `Enter the ${label}.` })
    .trim()
    .min(1, { error: `Enter the ${label}.` })
    .regex(MONEY, { error: `Enter the ${label} as a number with up to 2 decimals, e.g. 19.99.` })
    .transform(normalizeMoney);

const optionalMoney = (label: string) => z.preprocess(blankToNull, money(label).nullable());

const percent = (label: string) =>
  z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .regex(PERCENT, { error: `Enter the ${label} as a number, e.g. 7.5.` })
      .refine((v) => toCents(v) <= 10000, { error: `${label[0].toUpperCase()}${label.slice(1)} can't be more than 100%.` })
      .transform(normalizeMoney)
      .nullable(),
  );

const stockSchema = z
  .string({ error: "Enter the stock." })
  .trim()
  .regex(/^\d{1,7}$/, { error: "Stock must be a whole number, 0 or more." })
  .transform(Number);

const optionalText = (max: number, label: string) =>
  z.preprocess(blankToNull, z.string().trim().max(max, { error: `${label} must be ${max} characters or fewer.` }).nullable());

const sku = optionalText(64, "SKU").refine((v) => v === null || /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(v), {
  error: "SKU can use letters, numbers, dots, dashes, slashes and underscores.",
});

const optionalRef = (message: string) => z.preprocess(blankToNull, z.cuid({ error: message }).nullable());

export const DISCOUNT_TYPES = ["AMOUNT", "PERCENTAGE"] as const;

/** The product's own fields (everything except images and variations). */
export const productFieldsSchema = z
  .object({
    name: z
      .string({ error: "Enter the product name." })
      .trim()
      .min(1, { error: "Enter the product name." })
      .min(2, { error: "Product name must be at least 2 characters." })
      .max(150, { error: "Product name must be 150 characters or fewer." }),
    shortDescription: optionalText(500, "Short description"),
    description: z
      .string({ error: "Enter a description." })
      .trim()
      .min(1, { error: "Enter a description." })
      .min(10, { error: "Description must be at least 10 characters." })
      .max(10000, { error: "Description must be 10,000 characters or fewer." }),

    categoryId: z.cuid({ error: "Choose a category." }),
    subCategoryId: optionalRef("Choose a valid sub category."),
    subSubCategoryId: optionalRef("Choose a valid sub sub category."),
    brandId: optionalRef("Choose a valid brand."),
    sku,

    price: money("price").refine((v) => toCents(v) > 0, { error: "Price must be more than 0." }),
    compareAtPrice: optionalMoney("compare-at price"),
    discount: optionalMoney("discount"),
    discountType: z.enum(DISCOUNT_TYPES, { error: "Choose a discount type." }),
    taxRate: percent("tax rate"),
    stock: stockSchema,

    metaTitle: optionalText(150, "Meta title"),
    metaDescription: optionalText(300, "Meta description"),
  })
  .refine((d) => d.subSubCategoryId === null || d.subCategoryId !== null, {
    error: "Choose a sub category first.",
    path: ["subSubCategoryId"],
  })
  .superRefine((d, ctx) => {
    if (d.discount === null) return;
    if (d.discountType === "PERCENTAGE" && toCents(d.discount) > 10000) {
      ctx.addIssue({ code: "custom", message: "A percentage discount can't be more than 100%.", path: ["discount"] });
    }
    if (d.discountType === "AMOUNT" && toCents(d.discount) > toCents(d.price)) {
      ctx.addIssue({ code: "custom", message: "The discount can't be more than the price.", path: ["discount"] });
    }
  });

export type ProductFieldsInput = z.input<typeof productFieldsSchema>;
export type ProductFields = z.output<typeof productFieldsSchema>;

// ---- Images ----------------------------------------------------------------

export const GALLERY_LIMIT = 10;

/**
 * The gallery as submitted: an ordered list where each entry either keeps an
 * image the product already has (its path — checked on the server against the
 * product's own stored gallery) or refers to a newly uploaded file field.
 */
export const galleryPlanSchema = z
  .array(
    z.union([
      z.object({ keep: z.string().max(200) }),
      z.object({ upload: z.number().int().min(0).max(GALLERY_LIMIT - 1) }),
    ]),
  )
  .max(GALLERY_LIMIT, { error: `Add at most ${GALLERY_LIMIT} additional images.` })
  .refine(
    (plan) => {
      const kept = plan.flatMap((entry) => ("keep" in entry ? [entry.keep] : []));
      return new Set(kept).size === kept.length;
    },
    { error: "The additional images are invalid. Reload the page and try again." },
  );

export type GalleryPlan = z.infer<typeof galleryPlanSchema>;

// ---- Variations ------------------------------------------------------------

const groupSchema = z.object({
  name: z.string().trim(),
  values: z.array(z.string().trim()).max(VARIATION_LIMITS.valuesPerGroup + 1),
});

const rowSchema = z.object({
  // Trimmed like the group names and values, so the two always line up.
  attributes: z
    .record(z.string(), z.string())
    .transform((attrs) => Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k.trim(), v.trim()]))),
  price: money("variation price").refine((v) => toCents(v) > 0, { error: "Variation price must be more than 0." }),
  stock: stockSchema,
  sku,
  /** keep the saved image (if any), remove it, or use uploaded file `variationImage_<index>`. */
  image: z.enum(["keep", "remove", "upload"]),
});

export type VariationRowInput = z.input<typeof rowSchema>;

/**
 * Variations as submitted. The server does not trust the rows: each must be a
 * genuine combination of the submitted groups, with no duplicates; names are
 * rebuilt from the groups, never taken from the client.
 */
export const variationPlanSchema = z
  .object({
    enabled: z.boolean(),
    groups: z.array(groupSchema).max(VARIATION_LIMITS.groups + 1),
    rows: z.array(rowSchema).max(VARIATION_LIMITS.combinations),
  })
  .superRefine((plan, ctx) => {
    if (!plan.enabled) return;
    for (const message of groupProblems(plan.groups)) ctx.addIssue({ code: "custom", message, path: ["groups"] });
    if (ctx.issues?.length) return;

    if (!plan.rows.length) {
      ctx.addIssue({ code: "custom", message: "Keep at least one variation, or turn variations off.", path: ["rows"] });
      return;
    }
    const valid = new Set(combinations(plan.groups).map(comboKey));
    const seen = new Set<string>();
    const names = plan.groups.map((g) => g.name);
    plan.rows.forEach((row, index) => {
      const keys = Object.keys(row.attributes);
      const key = comboKey(row.attributes as Attributes);
      if (keys.length !== names.length || !names.every((n) => keys.includes(n)) || !valid.has(key)) {
        ctx.addIssue({ code: "custom", message: "This variation doesn't match the attributes.", path: ["rows", index] });
      } else if (seen.has(key)) {
        ctx.addIssue({ code: "custom", message: "This variation is listed twice.", path: ["rows", index] });
      }
      seen.add(key);
    });
    // A SKU identifies one variation, so it can't repeat within the product.
    const skus = new Map<string, number>();
    plan.rows.forEach((row, index) => {
      if (!row.sku) return;
      const sku = row.sku.toLowerCase();
      if (skus.has(sku)) {
        ctx.addIssue({ code: "custom", message: `SKU "${row.sku}" is used by more than one variation.`, path: ["rows", index] });
      }
      skus.set(sku, index);
    });
  });

export type VariationPlan = z.infer<typeof variationPlanSchema>;

/**
 * Rules that need both the product fields and its variations: a flat
 * (AMOUNT) discount can't exceed the lowest variation price, just as it can't
 * exceed the product price. Used by the form and the Server Actions alike.
 */
export function discountProblem(fields: Pick<ProductFields, "discount" | "discountType">, plan: VariationPlan): string | null {
  if (!plan.enabled || fields.discount === null || fields.discountType !== "AMOUNT" || !plan.rows.length) return null;
  const lowest = Math.min(...plan.rows.map((row) => toCents(row.price)));
  return toCents(fields.discount) > lowest
    ? `The discount can't be more than the lowest variation price (${normalizeMoney(String(lowest / 100))}).`
    : null;
}

/** Parse a JSON form field, then validate it; malformed JSON is a validation failure. */
export function parseJsonField<T extends z.ZodType>(schema: T, raw: unknown) {
  let value: unknown;
  try {
    value = JSON.parse(typeof raw === "string" ? raw : "");
  } catch {
    value = undefined;
  }
  return schema.safeParse(value);
}

// ---- List ------------------------------------------------------------------

export const productListParamsSchema = z.object({
  q: z.string().trim().max(80).catch(""),
});

export type ProductListParams = z.infer<typeof productListParamsSchema>;
