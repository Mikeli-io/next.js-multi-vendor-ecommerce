"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { isForeignKeyViolation, isUniqueViolation, violatedTarget } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug, slugify } from "@/lib/slug";
import { InvalidImageError, removeImage, saveImage } from "@/lib/uploads/images";
import {
  catalogIdSchema,
  categoryFormSchema,
  subCategoryFormSchema,
  subSubCategoryFormSchema,
} from "@/lib/validation/catalog";
import { toFieldErrors } from "@/lib/validation/field-errors";
import type { FormActionResult } from "./form-result";

/**
 * Admin mutations for the category taxonomy. Like the brand actions, each:
 *  1. checks the ADMIN role first, outside any try/catch, so the guard's
 *     redirect is never swallowed;
 *  2. validates with the same Zod schema its form uses;
 *  3. maps database failures to safe messages (raw errors are only logged).
 *
 * Deletes never cascade: a parent with children is refused with an
 * explanation, and the schema's `onDelete: Restrict` blocks it at the database
 * level too, should anything slip past the check.
 */

const UNEXPECTED = "Something went wrong. Please try again.";
const GONE = "This item no longer exists.";

function revalidateTaxonomy() {
  // Counts and parent names appear across all three lists.
  revalidatePath("/admin/categories");
  revalidatePath("/admin/sub-categories");
  revalidatePath("/admin/sub-sub-categories");
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ---- Categories ---------------------------------------------------------------

const DUPLICATE_CATEGORY = "A category with this name already exists.";

function readCategory(formData: FormData) {
  return categoryFormSchema.safeParse({ name: formData.get("name") ?? "", image: formData.get("image") });
}

function categorySlugTaken(exceptId?: string) {
  return async (candidate: string) => {
    const found = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } });
    return Boolean(found && found.id !== exceptId);
  };
}

async function categoryNameTaken(name: string, exceptId?: string) {
  // Case-insensitive: the column's collation is utf8mb4_unicode_ci.
  const found = await prisma.category.findUnique({ where: { name }, select: { id: true } });
  return Boolean(found && found.id !== exceptId);
}

export async function createCategory(formData: FormData): Promise<FormActionResult> {
  await requireAdmin();

  const parsed = readCategory(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { name, image } = parsed.data;

  if (await categoryNameTaken(name)) return { ok: false, fieldErrors: { name: [DUPLICATE_CATEGORY] } };

  let imagePath: string | null = null;
  try {
    if (image) imagePath = await saveImage("categories", image);
    const slug = await generateUniqueSlug(name, categorySlugTaken(), "category");
    await prisma.category.create({ data: { name, slug, image: imagePath }, select: { id: true } });
  } catch (error) {
    await removeImage("categories", imagePath);
    if (error instanceof InvalidImageError) return { ok: false, fieldErrors: { image: [error.message] } };
    if (isUniqueViolation(error)) {
      return violatedTarget(error).includes("slug")
        ? { ok: false, formError: "Another category was just saved with a similar name. Please try again." }
        : { ok: false, fieldErrors: { name: [DUPLICATE_CATEGORY] } };
    }
    console.error("createCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  revalidateTaxonomy();
  return { ok: true, message: `"${name}" was created.` };
}

export async function updateCategory(id: string, formData: FormData): Promise<FormActionResult> {
  await requireAdmin();

  if (!catalogIdSchema.safeParse(id).success) return { ok: false, formError: GONE };
  const existing = await prisma.category.findUnique({ where: { id }, select: { name: true, slug: true, image: true } });
  if (!existing) return { ok: false, formError: GONE };

  const parsed = readCategory(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { name, image } = parsed.data;

  if (await categoryNameTaken(name, id)) return { ok: false, fieldErrors: { name: [DUPLICATE_CATEGORY] } };

  let newImage: string | null = null;
  try {
    if (image) newImage = await saveImage("categories", image);
    // The slug follows the name, regenerated only when its slug form changes.
    const slug =
      slugify(name) === slugify(existing.name)
        ? existing.slug
        : await generateUniqueSlug(name, categorySlugTaken(id), "category");
    await prisma.category.update({
      where: { id },
      data: { name, slug, ...(newImage ? { image: newImage } : {}) },
      select: { id: true },
    });
  } catch (error) {
    await removeImage("categories", newImage);
    if (error instanceof InvalidImageError) return { ok: false, fieldErrors: { image: [error.message] } };
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { name: [DUPLICATE_CATEGORY] } };
    console.error("updateCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  // Only once the row points at the new file is the old one safe to delete.
  if (newImage) await removeImage("categories", existing.image);
  revalidateTaxonomy();
  return { ok: true, message: `"${name}" was updated.` };
}

export async function deleteCategory(id: string): Promise<FormActionResult> {
  await requireAdmin();

  if (!catalogIdSchema.safeParse(id).success) return { ok: false, formError: GONE };
  const category = await prisma.category.findUnique({
    where: { id },
    select: { name: true, image: true, _count: { select: { subCategories: true } } },
  });
  if (!category) return { ok: false, formError: GONE };

  const children = category._count.subCategories;
  if (children > 0) {
    return {
      ok: false,
      formError: `"${category.name}" has ${plural(children, "sub category", "sub categories")}, so it can't be deleted. Delete or move them first.`,
    };
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { ok: false, formError: `"${category.name}" still has sub categories, so it can't be deleted.` };
    }
    console.error("deleteCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  await removeImage("categories", category.image);
  revalidateTaxonomy();
  return { ok: true, message: `"${category.name}" was deleted.` };
}

// ---- Sub categories -------------------------------------------------------------

function readSubCategory(formData: FormData) {
  return subCategoryFormSchema.safeParse({
    categoryId: formData.get("categoryId") ?? "",
    name: formData.get("name") ?? "",
  });
}

/** Validate a sub category submission against the database. */
async function checkSubCategory(
  categoryId: string,
  name: string,
  exceptId?: string,
): Promise<FormActionResult | null> {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } });
  if (!category) {
    return { ok: false, fieldErrors: { categoryId: ["This category no longer exists. Choose another."] } };
  }
  const clash = await prisma.subCategory.findUnique({
    where: { categoryId_name: { categoryId, name } },
    select: { id: true },
  });
  if (clash && clash.id !== exceptId) {
    return { ok: false, fieldErrors: { name: [`"${category.name}" already has a sub category with this name.`] } };
  }
  return null;
}

export async function createSubCategory(formData: FormData): Promise<FormActionResult> {
  await requireAdmin();

  const parsed = readSubCategory(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { categoryId, name } = parsed.data;

  const problem = await checkSubCategory(categoryId, name);
  if (problem) return problem;

  try {
    await prisma.subCategory.create({ data: { categoryId, name }, select: { id: true } });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { name: ["This category already has a sub category with this name."] } };
    if (isForeignKeyViolation(error)) return { ok: false, fieldErrors: { categoryId: ["This category no longer exists. Choose another."] } };
    console.error("createSubCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  revalidateTaxonomy();
  return { ok: true, message: `"${name}" was created.` };
}

export async function updateSubCategory(id: string, formData: FormData): Promise<FormActionResult> {
  await requireAdmin();

  if (!catalogIdSchema.safeParse(id).success) return { ok: false, formError: GONE };
  if (!(await prisma.subCategory.findUnique({ where: { id }, select: { id: true } }))) {
    return { ok: false, formError: GONE };
  }

  const parsed = readSubCategory(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { categoryId, name } = parsed.data;

  const problem = await checkSubCategory(categoryId, name, id);
  if (problem) return problem;

  try {
    // Moving it to another category moves its sub sub categories with it:
    // their category is derived through this row.
    await prisma.subCategory.update({ where: { id }, data: { categoryId, name }, select: { id: true } });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { name: ["This category already has a sub category with this name."] } };
    if (isForeignKeyViolation(error)) return { ok: false, fieldErrors: { categoryId: ["This category no longer exists. Choose another."] } };
    console.error("updateSubCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  revalidateTaxonomy();
  return { ok: true, message: `"${name}" was updated.` };
}

export async function deleteSubCategory(id: string): Promise<FormActionResult> {
  await requireAdmin();

  if (!catalogIdSchema.safeParse(id).success) return { ok: false, formError: GONE };
  const sub = await prisma.subCategory.findUnique({
    where: { id },
    select: { name: true, _count: { select: { subSubCategories: true } } },
  });
  if (!sub) return { ok: false, formError: GONE };

  const children = sub._count.subSubCategories;
  if (children > 0) {
    return {
      ok: false,
      formError: `"${sub.name}" has ${plural(children, "sub sub category", "sub sub categories")}, so it can't be deleted. Delete or move them first.`,
    };
  }

  try {
    await prisma.subCategory.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { ok: false, formError: `"${sub.name}" still has sub sub categories, so it can't be deleted.` };
    }
    console.error("deleteSubCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  revalidateTaxonomy();
  return { ok: true, message: `"${sub.name}" was deleted.` };
}

// ---- Sub sub categories -------------------------------------------------------

function readSubSubCategory(formData: FormData) {
  return subSubCategoryFormSchema.safeParse({
    categoryId: formData.get("categoryId") ?? "",
    subCategoryId: formData.get("subCategoryId") ?? "",
    name: formData.get("name") ?? "",
  });
}

/**
 * Validate a sub sub category submission. The submitted category must be the
 * sub category's actual parent — this is what stops a tampered request pairing
 * a sub category with the wrong category.
 */
async function checkSubSubCategory(
  categoryId: string,
  subCategoryId: string,
  name: string,
  exceptId?: string,
): Promise<FormActionResult | null> {
  const sub = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
    select: { categoryId: true, name: true },
  });
  if (!sub) {
    return { ok: false, fieldErrors: { subCategoryId: ["This sub category no longer exists. Choose another."] } };
  }
  if (sub.categoryId !== categoryId) {
    return { ok: false, fieldErrors: { subCategoryId: ["That sub category doesn't belong to the selected category."] } };
  }
  const clash = await prisma.subSubCategory.findUnique({
    where: { subCategoryId_name: { subCategoryId, name } },
    select: { id: true },
  });
  if (clash && clash.id !== exceptId) {
    return { ok: false, fieldErrors: { name: [`"${sub.name}" already has a sub sub category with this name.`] } };
  }
  return null;
}

export async function createSubSubCategory(formData: FormData): Promise<FormActionResult> {
  await requireAdmin();

  const parsed = readSubSubCategory(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { categoryId, subCategoryId, name } = parsed.data;

  const problem = await checkSubSubCategory(categoryId, subCategoryId, name);
  if (problem) return problem;

  try {
    // Only the sub category is stored; the category is derived through it.
    await prisma.subSubCategory.create({ data: { subCategoryId, name }, select: { id: true } });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { name: ["This sub category already has a sub sub category with this name."] } };
    if (isForeignKeyViolation(error)) return { ok: false, fieldErrors: { subCategoryId: ["This sub category no longer exists. Choose another."] } };
    console.error("createSubSubCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  revalidateTaxonomy();
  return { ok: true, message: `"${name}" was created.` };
}

export async function updateSubSubCategory(id: string, formData: FormData): Promise<FormActionResult> {
  await requireAdmin();

  if (!catalogIdSchema.safeParse(id).success) return { ok: false, formError: GONE };
  if (!(await prisma.subSubCategory.findUnique({ where: { id }, select: { id: true } }))) {
    return { ok: false, formError: GONE };
  }

  const parsed = readSubSubCategory(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { categoryId, subCategoryId, name } = parsed.data;

  const problem = await checkSubSubCategory(categoryId, subCategoryId, name, id);
  if (problem) return problem;

  try {
    await prisma.subSubCategory.update({ where: { id }, data: { subCategoryId, name }, select: { id: true } });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { name: ["This sub category already has a sub sub category with this name."] } };
    if (isForeignKeyViolation(error)) return { ok: false, fieldErrors: { subCategoryId: ["This sub category no longer exists. Choose another."] } };
    console.error("updateSubSubCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  revalidateTaxonomy();
  return { ok: true, message: `"${name}" was updated.` };
}

export async function deleteSubSubCategory(id: string): Promise<FormActionResult> {
  await requireAdmin();

  if (!catalogIdSchema.safeParse(id).success) return { ok: false, formError: GONE };
  const item = await prisma.subSubCategory.findUnique({ where: { id }, select: { name: true } });
  if (!item) return { ok: false, formError: GONE };

  try {
    await prisma.subSubCategory.delete({ where: { id } });
  } catch (error) {
    console.error("deleteSubSubCategory failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  revalidateTaxonomy();
  return { ok: true, message: `"${item.name}" was deleted.` };
}
