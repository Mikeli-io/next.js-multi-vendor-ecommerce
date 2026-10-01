import * as z from "zod";

import { optionalImageSchema } from "./image";

/**
 * Category taxonomy form rules, shared by the client forms (instant inline
 * errors) and the Server Actions (the authoritative check). Slugs and product
 * counts are derived on the server and never accepted as input.
 */

const name = (noun: string) =>
  z
    .string({ error: `Enter a ${noun} name.` })
    .trim()
    .min(2, { error: `${noun[0].toUpperCase()}${noun.slice(1)} name must be at least 2 characters.` })
    .max(60, { error: `${noun[0].toUpperCase()}${noun.slice(1)} name must be 60 characters or fewer.` });

const ref = (message: string) => z.cuid({ error: message });

export const categoryFormSchema = z.object({
  name: name("category"),
  image: optionalImageSchema,
});

export const subCategoryFormSchema = z.object({
  categoryId: ref("Choose a category."),
  name: name("sub category"),
});

/**
 * `categoryId` is submitted so the server can confirm the chosen sub category
 * really belongs to it — it is not stored (the category is derived through
 * the sub category).
 */
export const subSubCategoryFormSchema = z.object({
  categoryId: ref("Choose a category."),
  subCategoryId: ref("Choose a sub category."),
  name: name("sub sub category"),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
export type SubCategoryFormInput = z.infer<typeof subCategoryFormSchema>;
export type SubSubCategoryFormInput = z.infer<typeof subSubCategoryFormSchema>;

/** Ids are Prisma cuids; reject anything else before touching the DB. */
export const catalogIdSchema = z.cuid({ error: "This item no longer exists." });

/** List filters read from the URL. Unknown or malformed values are dropped. */
const q = z.string().trim().max(60).catch("");
const optionalId = z.cuid().optional().catch(undefined);

export const categoryListParamsSchema = z.object({ q });
export const subCategoryListParamsSchema = z.object({ q, category: optionalId });
export const subSubCategoryListParamsSchema = z.object({ q, category: optionalId, subCategory: optionalId });

export type CategoryListParams = z.infer<typeof categoryListParamsSchema>;
export type SubCategoryListParams = z.infer<typeof subCategoryListParamsSchema>;
export type SubSubCategoryListParams = z.infer<typeof subSubCategoryListParamsSchema>;

/** Read a single string search param; arrays and absence become "". */
export function param(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
