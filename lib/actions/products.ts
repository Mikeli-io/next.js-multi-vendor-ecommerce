"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireApprovedVendor } from "@/lib/auth/guards";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { galleryPaths } from "@/lib/products/queries";
import { comboKey, variationName, type Attributes } from "@/lib/products/variations";
import { generateUniqueSlug, slugify } from "@/lib/slug";
import { InvalidImageError, removeImage, saveImage } from "@/lib/uploads/images";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { optionalImageSchema } from "@/lib/validation/image";
import {
  discountProblem,
  galleryPlanSchema,
  parseJsonField,
  productFieldsSchema,
  productIdSchema,
  variationPlanSchema,
  type GalleryPlan,
  type ProductFields,
  type VariationPlan,
} from "@/lib/validation/product";
import type { FormActionResult } from "./form-result";

/**
 * Vendor product mutations.
 *
 * Every action:
 *  1. resolves the APPROVED vendor from the session first, outside any
 *     try/catch (`requireApprovedVendor` re-reads role and store status from
 *     the database);
 *  2. scopes every read and write to `{ id, vendorId: <that vendor> }` — a
 *     product id from another store simply matches nothing;
 *  3. never reads vendorId, approvalStatus, isActive or slug from the form:
 *     create sets them, edits leave approvalStatus/isActive untouched;
 *  4. stores files before the database write, removes them again if the write
 *     fails, and deletes replaced/removed files only after the write commits.
 */

const UNEXPECTED = "Something went wrong. Please try again.";
const GONE = "This product no longer exists.";
const FOLDER = "products";

export type ProductActionResult =
  | { ok: true; message: string; productId: string }
  | Extract<FormActionResult, { ok: false }>;

type Failure = Extract<FormActionResult, { ok: false }>;

// ---- Reading the form ----------------------------------------------------------

type ProductSubmission = {
  fields: ProductFields;
  thumbnail: File | undefined;
  removeThumbnail: boolean;
  gallery: GalleryPlan;
  galleryFiles: Map<number, File>;
  variations: VariationPlan;
  variationFiles: Map<number, File>;
};

const fileField = (formData: FormData, key: string) => optionalImageSchema.safeParse(formData.get(key));

function readSubmission(formData: FormData): { ok: true; data: ProductSubmission } | Failure {
  const text = (key: string) => String(formData.get(key) ?? "");
  const fields = productFieldsSchema.safeParse({
    name: text("name"),
    shortDescription: text("shortDescription"),
    description: text("description"),
    categoryId: text("categoryId"),
    subCategoryId: text("subCategoryId"),
    subSubCategoryId: text("subSubCategoryId"),
    brandId: text("brandId"),
    sku: text("sku"),
    price: text("price"),
    compareAtPrice: text("compareAtPrice"),
    discount: text("discount"),
    discountType: text("discountType"),
    taxRate: text("taxRate"),
    stock: text("stock") || "0",
    metaTitle: text("metaTitle"),
    metaDescription: text("metaDescription"),
  });
  const fieldErrors: Record<string, string[]> = fields.success ? {} : toFieldErrors(fields.error);

  const thumbnail = fileField(formData, "thumbnail");
  if (!thumbnail.success) fieldErrors.thumbnail = thumbnail.error.issues.map((i) => i.message);

  const gallery = parseJsonField(galleryPlanSchema, formData.get("gallery"));
  const galleryFiles = new Map<number, File>();
  if (!gallery.success) {
    fieldErrors.gallery = [gallery.error.issues[0]?.message ?? "The additional images are invalid."];
  } else {
    for (const entry of gallery.data) {
      if (!("upload" in entry)) continue;
      const file = fileField(formData, `galleryFile_${entry.upload}`);
      if (!file.success) fieldErrors.gallery = file.error.issues.map((i) => i.message);
      else if (!file.data) fieldErrors.gallery = ["An additional image is missing. Please add it again."];
      else galleryFiles.set(entry.upload, file.data);
    }
  }

  const variations = parseJsonField(variationPlanSchema, formData.get("variations"));
  const variationFiles = new Map<number, File>();
  if (!variations.success) {
    fieldErrors.variations = [...new Set(variations.error.issues.map((i) => i.message))];
  } else if (variations.data.enabled) {
    variations.data.rows.forEach((row, index) => {
      if (row.image !== "upload") return;
      const file = fileField(formData, `variationImage_${index}`);
      const label = variationName(variations.data.groups, row.attributes);
      if (!file.success) (fieldErrors.variations ??= []).push(`${label}: ${file.error.issues[0]?.message}`);
      else if (!file.data) (fieldErrors.variations ??= []).push(`${label}: the image is missing. Please add it again.`);
      else variationFiles.set(index, file.data);
    });
  }

  if (fields.success && variations.success) {
    const discount = discountProblem(fields.data, variations.data);
    if (discount) fieldErrors.discount = [discount];
  }

  if (Object.keys(fieldErrors).length || !fields.success || !gallery.success || !variations.success || !thumbnail.success) {
    return { ok: false, fieldErrors };
  }
  return {
    ok: true,
    data: {
      fields: fields.data,
      thumbnail: thumbnail.data,
      removeThumbnail: formData.get("removeThumbnail") === "1",
      gallery: gallery.data,
      galleryFiles,
      variations: variations.data,
      variationFiles,
    },
  };
}

/**
 * The taxonomy and brand must exist and fit together: the sub category must
 * belong to the category, the sub sub category to the sub category. The
 * dropdowns already enforce this; this is the check that counts.
 */
async function checkReferences(fields: ProductFields, keepBrandId: string | null): Promise<Failure | null> {
  const [category, sub, subSub, brand] = await Promise.all([
    prisma.category.findUnique({ where: { id: fields.categoryId }, select: { id: true } }),
    fields.subCategoryId
      ? prisma.subCategory.findUnique({ where: { id: fields.subCategoryId }, select: { categoryId: true } })
      : null,
    fields.subSubCategoryId
      ? prisma.subSubCategory.findUnique({ where: { id: fields.subSubCategoryId }, select: { subCategoryId: true } })
      : null,
    fields.brandId ? prisma.brand.findUnique({ where: { id: fields.brandId }, select: { id: true, status: true } }) : null,
  ]);

  const fieldErrors: Record<string, string[]> = {};
  if (!category) fieldErrors.categoryId = ["This category no longer exists. Choose another."];
  if (fields.subCategoryId && sub?.categoryId !== fields.categoryId) {
    fieldErrors.subCategoryId = ["This sub category doesn't belong to the chosen category."];
  }
  if (fields.subSubCategoryId && subSub?.subCategoryId !== fields.subCategoryId) {
    fieldErrors.subSubCategoryId = ["This sub sub category doesn't belong to the chosen sub category."];
  }
  // A product may keep a brand that was deactivated after it was chosen, but
  // can't newly pick an inactive one.
  if (fields.brandId && (!brand || (brand.status !== "ACTIVE" && brand.id !== keepBrandId))) {
    fieldErrors.brandId = ["This brand isn't available. Choose another."];
  }
  return Object.keys(fieldErrors).length ? { ok: false, fieldErrors } : null;
}

/** The product columns shared by create and update (never vendorId/approval/active/slug). */
function productData(fields: ProductFields, variations: VariationPlan) {
  return {
    name: fields.name,
    shortDescription: fields.shortDescription,
    description: fields.description,
    categoryId: fields.categoryId,
    subCategoryId: fields.subCategoryId,
    subSubCategoryId: fields.subSubCategoryId,
    brandId: fields.brandId,
    sku: fields.sku,
    price: fields.price,
    compareAtPrice: fields.compareAtPrice,
    discount: fields.discount,
    discountType: fields.discountType,
    taxRate: fields.taxRate,
    // With variations, their stock is the truth and Product.stock is ignored;
    // it is stored as 0 so no stale number lingers.
    stock: variations.enabled ? 0 : fields.stock,
    metaTitle: fields.metaTitle,
    metaDescription: fields.metaDescription,
  };
}

const galleryValue = (paths: string[]) => (paths.length ? paths : Prisma.DbNull);

/** Stores uploads, remembering each so a failed write can remove them all. */
class UploadBatch {
  readonly saved: string[] = [];
  async save(file: File, field: string): Promise<string> {
    try {
      const path = await saveImage(FOLDER, file);
      this.saved.push(path);
      return path;
    } catch (error) {
      if (error instanceof InvalidImageError) throw new FieldFileError(field, error.message);
      throw error;
    }
  }
  discard() {
    return Promise.all(this.saved.map((path) => removeImage(FOLDER, path)));
  }
}

class FieldFileError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

class ConflictError extends Error {}

function failureFor(error: unknown, action: string): Failure {
  if (error instanceof FieldFileError) return { ok: false, fieldErrors: { [error.field]: [error.message] } };
  if (error instanceof ConflictError) {
    return { ok: false, formError: "This product was just changed elsewhere. Reload the page and try again." };
  }
  if (isUniqueViolation(error)) return { ok: false, formError: "Another product was just saved with a similar name. Please try again." };
  if (isForeignKeyViolation(error)) {
    return { ok: false, formError: "A category or brand you chose was just removed. Please choose again." };
  }
  console.error(`${action} failed`, error);
  return { ok: false, formError: UNEXPECTED };
}

function slugTaken(exceptId?: string) {
  return async (candidate: string) => {
    const found = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    return Boolean(found && found.id !== exceptId);
  };
}

function revalidateProducts(id?: string) {
  revalidatePath("/vendor/products");
  if (id) revalidatePath(`/vendor/products/${id}`);
  // Product counts appear on the admin vendor, brand and taxonomy pages.
  revalidatePath("/admin", "layout");
}

// ---- Create --------------------------------------------------------------------

export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  const user = await requireApprovedVendor();

  const read = readSubmission(formData);
  if (!read.ok) return read;
  const { fields, thumbnail, gallery, galleryFiles, variations, variationFiles } = read.data;

  const problem = await checkReferences(fields, null);
  if (problem) return problem;
  if (gallery.some((entry) => "keep" in entry)) {
    return { ok: false, fieldErrors: { gallery: ["The additional images are invalid. Please add them again."] } };
  }

  const uploads = new UploadBatch();
  try {
    const thumbnailPath = thumbnail ? await uploads.save(thumbnail, "thumbnail") : null;
    const galleryList: string[] = [];
    for (const entry of gallery) {
      if ("upload" in entry) galleryList.push(await uploads.save(galleryFiles.get(entry.upload)!, "gallery"));
    }
    const rows = variations.enabled ? variations.rows : [];
    const variationData = [];
    for (const [index, row] of rows.entries()) {
      const file = variationFiles.get(index);
      variationData.push({
        name: variationName(variations.groups, row.attributes),
        attributes: row.attributes,
        price: row.price,
        stock: row.stock,
        sku: row.sku,
        image: file ? await uploads.save(file, "variations") : null,
      });
    }

    const slug = await generateUniqueSlug(fields.name, slugTaken(), "product");
    // One nested create: the product and all its variations commit together.
    const product = await prisma.product.create({
      data: {
        ...productData(fields, variations),
        slug,
        vendorId: user.vendor.id,
        approvalStatus: "PENDING",
        isActive: true,
        thumbnail: thumbnailPath,
        gallery: galleryValue(galleryList),
        variations: { create: variationData },
      },
      select: { id: true },
    });

    revalidateProducts(product.id);
    return { ok: true, message: `"${fields.name}" was created and is pending approval.`, productId: product.id };
  } catch (error) {
    await uploads.discard();
    return failureFor(error, "createProduct");
  }
}

// ---- Update --------------------------------------------------------------------

export async function updateProduct(id: string, formData: FormData): Promise<ProductActionResult> {
  const user = await requireApprovedVendor();
  if (!productIdSchema.safeParse(id).success) return { ok: false, formError: GONE };

  const existing = await prisma.product.findFirst({
    where: { id, vendorId: user.vendor.id },
    select: {
      name: true,
      slug: true,
      brandId: true,
      thumbnail: true,
      gallery: true,
      updatedAt: true,
      variations: { select: { id: true, image: true, attributes: true } },
    },
  });
  if (!existing) return { ok: false, formError: GONE };

  // The version the edit form was loaded with: if the product changed since
  // (another tab, a toggle, an admin), saving the stale form would silently
  // undo that change — e.g. delete variations added elsewhere — so refuse.
  const version = formData.get("version");
  if (typeof version === "string" && version !== existing.updatedAt.toISOString()) {
    return { ok: false, formError: "This product was changed since you opened it. Reload the page to get the latest version, then make your changes again." };
  }

  const read = readSubmission(formData);
  if (!read.ok) return read;
  const { fields, thumbnail, removeThumbnail, gallery, galleryFiles, variations, variationFiles } = read.data;

  const problem = await checkReferences(fields, existing.brandId);
  if (problem) return problem;

  // Kept gallery images must be ones this product already has — a client
  // can't attach an arbitrary path (or another product's file).
  const currentGallery = galleryPaths(existing.gallery);
  if (gallery.some((entry) => "keep" in entry && !currentGallery.includes(entry.keep))) {
    return { ok: false, fieldErrors: { gallery: ["The additional images changed. Reload the page and try again."] } };
  }

  // Match submitted combinations to saved rows by their attribute values.
  const savedByKey = new Map(existing.variations.map((v) => [comboKey(v.attributes as Attributes), v]));
  const rows = variations.enabled ? variations.rows : [];
  const keptIds = new Set<string>();

  const uploads = new UploadBatch();
  const filesToRemove: Array<string | null> = [];
  try {
    const nextThumbnail = thumbnail
      ? await uploads.save(thumbnail, "thumbnail")
      : removeThumbnail
        ? null
        : existing.thumbnail;
    if (nextThumbnail !== existing.thumbnail) filesToRemove.push(existing.thumbnail);

    const nextGallery: string[] = [];
    for (const entry of gallery) {
      nextGallery.push("keep" in entry ? entry.keep : await uploads.save(galleryFiles.get(entry.upload)!, "gallery"));
    }
    filesToRemove.push(...currentGallery.filter((path) => !nextGallery.includes(path)));

    const updates: Array<{ id: string; data: Prisma.ProductVariationUpdateInput }> = [];
    const creates: Prisma.ProductVariationCreateManyInput[] = [];
    for (const [index, row] of rows.entries()) {
      const saved = savedByKey.get(comboKey(row.attributes));
      const file = variationFiles.get(index);
      const uploaded = file ? await uploads.save(file, "variations") : null;
      const name = variationName(variations.groups, row.attributes);
      if (saved) {
        keptIds.add(saved.id);
        const image = uploaded ?? (row.image === "remove" ? null : saved.image);
        if (image !== saved.image) filesToRemove.push(saved.image);
        updates.push({
          id: saved.id,
          data: { name, attributes: row.attributes, price: row.price, stock: row.stock, sku: row.sku, image },
        });
      } else {
        creates.push({ productId: id, name, attributes: row.attributes, price: row.price, stock: row.stock, sku: row.sku, image: uploaded });
      }
    }
    const removed = existing.variations.filter((v) => !keptIds.has(v.id));
    filesToRemove.push(...removed.map((v) => v.image));

    // The slug follows the name, regenerated only when its slug form changes.
    const slug =
      slugify(fields.name) === slugify(existing.name)
        ? existing.slug
        : await generateUniqueSlug(fields.name, slugTaken(id), "product");

    await prisma.$transaction(async (tx) => {
      // Conditional on the version read above (and on ownership): a concurrent
      // edit makes this match nothing, so files are never cleaned up from
      // under another save.
      const { count } = await tx.product.updateMany({
        where: { id, vendorId: user.vendor.id, updatedAt: existing.updatedAt },
        data: { ...productData(fields, variations), slug, thumbnail: nextThumbnail, gallery: galleryValue(nextGallery) },
      });
      if (count === 0) throw new ConflictError();

      if (removed.length) {
        await tx.productVariation.deleteMany({ where: { productId: id, id: { in: removed.map((v) => v.id) } } });
      }
      for (const update of updates) {
        await tx.productVariation.update({ where: { id: update.id, productId: id }, data: update.data });
      }
      if (creates.length) await tx.productVariation.createMany({ data: creates });
    });
  } catch (error) {
    await uploads.discard();
    return failureFor(error, "updateProduct");
  }

  // Committed: nothing references these files any more.
  await Promise.all(filesToRemove.map((path) => removeImage(FOLDER, path)));
  revalidateProducts(id);
  return { ok: true, message: `"${fields.name}" was updated.`, productId: id };
}

// ---- Delete --------------------------------------------------------------------

export async function deleteProduct(id: string): Promise<FormActionResult> {
  const user = await requireApprovedVendor();
  if (!productIdSchema.safeParse(id).success) return { ok: false, formError: GONE };

  const product = await prisma.product.findFirst({
    where: { id, vendorId: user.vendor.id },
    select: { name: true, thumbnail: true, gallery: true, variations: { select: { image: true } } },
  });
  if (!product) return { ok: false, formError: GONE };

  try {
    // Variations go with it (onDelete: Cascade), in the same statement.
    const { count } = await prisma.product.deleteMany({ where: { id, vendorId: user.vendor.id } });
    if (count === 0) return { ok: false, formError: GONE };
  } catch (error) {
    console.error("deleteProduct failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  // Only after the rows are gone: a failed delete leaves every file in place.
  await Promise.all(
    [product.thumbnail, ...galleryPaths(product.gallery), ...product.variations.map((v) => v.image)].map((path) =>
      removeImage(FOLDER, path),
    ),
  );
  revalidateProducts();
  return { ok: true, message: `"${product.name}" was deleted.` };
}

// ---- Active / inactive -----------------------------------------------------------

/** The vendor's own on/off switch. Never touches `approvalStatus`. */
export async function setProductActive(id: string, active: boolean): Promise<FormActionResult> {
  const user = await requireApprovedVendor();
  if (!productIdSchema.safeParse(id).success || typeof active !== "boolean") {
    return { ok: false, formError: GONE };
  }

  try {
    const product = await prisma.product.findFirst({ where: { id, vendorId: user.vendor.id }, select: { name: true } });
    if (!product) return { ok: false, formError: GONE };
    const { count } = await prisma.product.updateMany({
      where: { id, vendorId: user.vendor.id },
      data: { isActive: active },
    });
    if (count === 0) return { ok: false, formError: GONE };
    revalidateProducts(id);
    return { ok: true, message: `"${product.name}" is now ${active ? "active" : "inactive"}.` };
  } catch (error) {
    console.error("setProductActive failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}
