"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/guards";
import { isForeignKeyViolation, isUniqueViolation, violatedTarget } from "@/lib/db-errors";
import { countBrandProducts } from "@/lib/brands/queries";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug, slugify } from "@/lib/slug";
import { InvalidImageError, removeImage, saveImage } from "@/lib/uploads/images";
import { brandFormSchema, brandIdSchema } from "@/lib/validation/brand";
import { toFieldErrors } from "@/lib/validation/field-errors";
import type { BrandActionResult } from "./brand-state";

/**
 * Admin brand mutations. Each one:
 *  1. checks the ADMIN role first, outside any try/catch, so the guard's
 *     redirect is never swallowed — the UI hiding these controls is not the
 *     protection, this is;
 *  2. validates with the same Zod schema the form uses;
 *  3. maps database failures to safe messages — raw Prisma errors are logged
 *     server-side and never returned.
 */

const DUPLICATE_NAME = "A brand with this name already exists.";
const UNEXPECTED = "Something went wrong. Please try again.";

function revalidateBrands(id?: string) {
  revalidatePath("/admin/brands");
  if (id) revalidatePath(`/admin/brands/${id}`);
}

function readForm(formData: FormData) {
  return brandFormSchema.safeParse({
    name: formData.get("name") ?? "",
    status: formData.get("status") ?? "",
    image: formData.get("image"),
  });
}

/** Whether `slug` is used by any brand other than `exceptId`. */
function slugTakenBy(exceptId?: string) {
  return async (candidate: string) => {
    const found = await prisma.brand.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return Boolean(found && found.id !== exceptId);
  };
}

/** Case-insensitive (the column's collation) duplicate-name check. */
async function nameTakenBy(name: string, exceptId?: string) {
  const found = await prisma.brand.findUnique({ where: { name }, select: { id: true } });
  return Boolean(found && found.id !== exceptId);
}

function uniqueViolationResult(error: Prisma.PrismaClientKnownRequestError): BrandActionResult {
  const target = violatedTarget(error);
  // A slug race is resolved by simply retrying (the next suffix is picked).
  return target.includes("slug")
    ? { ok: false, formError: "Another brand was just saved with a similar name. Please try again." }
    : { ok: false, fieldErrors: { name: [DUPLICATE_NAME] } };
}

export async function createBrand(formData: FormData): Promise<BrandActionResult> {
  await requireAdmin();

  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { name, status, image } = parsed.data;

  if (await nameTakenBy(name)) return { ok: false, fieldErrors: { name: [DUPLICATE_NAME] } };

  let imagePath: string | null = null;
  try {
    if (image) imagePath = await saveImage("brands", image);

    const slug = await generateUniqueSlug(name, slugTakenBy(), "brand");
    const brand = await prisma.brand.create({
      data: { name, slug, status, image: imagePath },
      select: { id: true },
    });

    revalidateBrands(brand.id);
    return { ok: true, message: `"${name}" was created.` };
  } catch (error) {
    // Nothing references an image stored for a write that failed.
    await removeImage("brands", imagePath);
    if (error instanceof InvalidImageError) {
      return { ok: false, fieldErrors: { image: [error.message] } };
    }
    if (isUniqueViolation(error)) return uniqueViolationResult(error);
    console.error("createBrand failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}

export async function updateBrand(id: string, formData: FormData): Promise<BrandActionResult> {
  await requireAdmin();

  const idCheck = brandIdSchema.safeParse(id);
  if (!idCheck.success) return { ok: false, formError: "This brand no longer exists." };

  const existing = await prisma.brand.findUnique({
    where: { id },
    select: { name: true, slug: true, image: true },
  });
  if (!existing) return { ok: false, formError: "This brand no longer exists." };

  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { name, status, image } = parsed.data;

  if (await nameTakenBy(name, id)) return { ok: false, fieldErrors: { name: [DUPLICATE_NAME] } };

  let newImage: string | null = null;
  try {
    if (image) newImage = await saveImage("brands", image);

    // The slug follows the name. It is only regenerated when the name's slug
    // form changes, so fixing capitalisation does not churn the URL.
    const slug =
      slugify(name) === slugify(existing.name)
        ? existing.slug
        : await generateUniqueSlug(name, slugTakenBy(id), "brand");

    await prisma.brand.update({
      where: { id },
      // No new upload → leave `image` untouched, keeping the current one.
      data: { name, slug, status, ...(newImage ? { image: newImage } : {}) },
      select: { id: true },
    });
  } catch (error) {
    await removeImage("brands", newImage);
    if (error instanceof InvalidImageError) {
      return { ok: false, fieldErrors: { image: [error.message] } };
    }
    if (isUniqueViolation(error)) return uniqueViolationResult(error);
    console.error("updateBrand failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  // Only once the row points at the new file is the old one safe to delete.
  if (newImage) await removeImage("brands", existing.image);

  revalidateBrands(id);
  return { ok: true, message: `"${name}" was updated.` };
}

export async function deleteBrand(id: string): Promise<BrandActionResult> {
  await requireAdmin();

  if (!brandIdSchema.safeParse(id).success) {
    return { ok: false, formError: "This brand no longer exists." };
  }

  const brand = await prisma.brand.findUnique({
    where: { id },
    select: { name: true, image: true },
  });
  if (!brand) return { ok: false, formError: "This brand no longer exists." };

  // Never cascade-delete products: a brand in use must be deactivated instead.
  const products = await countBrandProducts(id);
  if (products && products > 0) {
    return {
      ok: false,
      formError: `"${brand.name}" is used by ${products} product${products === 1 ? "" : "s"}, so it can't be deleted. Deactivate it instead.`,
    };
  }

  try {
    await prisma.brand.delete({ where: { id } });
  } catch (error) {
    // Foreign-key violation: products started referencing the brand meanwhile.
    if (isForeignKeyViolation(error)) {
      return {
        ok: false,
        formError: `"${brand.name}" is used by products, so it can't be deleted. Deactivate it instead.`,
      };
    }
    console.error("deleteBrand failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  await removeImage("brands", brand.image);
  revalidateBrands(id);
  return { ok: true, message: `"${brand.name}" was deleted.` };
}

export async function toggleBrandStatus(id: string): Promise<BrandActionResult> {
  await requireAdmin();

  if (!brandIdSchema.safeParse(id).success) {
    return { ok: false, formError: "This brand no longer exists." };
  }

  try {
    const current = await prisma.brand.findUnique({
      where: { id },
      select: { status: true, name: true },
    });
    if (!current) return { ok: false, formError: "This brand no longer exists." };

    const status = current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await prisma.brand.update({ where: { id }, data: { status }, select: { id: true } });

    revalidateBrands(id);
    return {
      ok: true,
      status,
      message: `"${current.name}" is now ${status === "ACTIVE" ? "active" : "inactive"}.`,
    };
  } catch (error) {
    console.error("toggleBrandStatus failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}
