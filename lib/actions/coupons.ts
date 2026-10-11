"use server";

import { revalidatePath } from "next/cache";

import { requireApprovedVendor } from "@/lib/auth/guards";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import {
  COUPON_EXPIRED,
  couponFormSchema,
  couponIdSchema,
  todayUtc,
  type CouponFormValues,
} from "@/lib/validation/coupon";
import { toFieldErrors } from "@/lib/validation/field-errors";
import type { FormActionResult } from "./form-result";

/**
 * Vendor coupon mutations. Every action resolves the APPROVED vendor from the
 * session first (outside any try/catch) and scopes every read and write to
 * `{ id, vendorId: <that vendor> }`; vendorId and status are never read from
 * the form.
 *
 * Applicability: ALL_PRODUCTS stores no product links. SPECIFIC_PRODUCTS
 * links exactly the submitted products, and every submitted id must be one
 * of the vendor's own products — a list with any other id is refused as a
 * whole, never partly applied. The coupon and its links are written in one
 * transaction.
 */

const UNEXPECTED = "Something went wrong. Please try again.";
const GONE = "This coupon no longer exists.";
const DUPLICATE_CODE = "This code is already in use. Choose another or generate a new one.";

export type CouponActionResult =
  | { ok: true; message: string; couponId: string }
  | Extract<FormActionResult, { ok: false }>;

function read(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  return couponFormSchema.safeParse({
    type: text("type"),
    title: text("title"),
    code: text("code"),
    limitPerUser: text("limitPerUser"),
    discountType: text("discountType") || "AMOUNT",
    discount: text("discount"),
    maxDiscount: text("maxDiscount"),
    minPurchase: text("minPurchase"),
    startDate: text("startDate"),
    expireDate: text("expireDate"),
    appliesTo: text("appliesTo") || "ALL_PRODUCTS",
    productIds: jsonArray(formData.get("productIds")),
  });
}

/** A JSON array form field; anything else becomes a value the schema rejects. */
function jsonArray(raw: FormDataEntryValue | null): unknown {
  if (raw === null || raw === "") return [];
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

const FOREIGN_PRODUCTS = "Some selected products aren't in your store. Reload the page and choose again.";

/**
 * True only if every id is one of this vendor's products. The query is scoped
 * to the vendor, so another store's product simply isn't counted.
 */
async function ownsAllProducts(vendorId: string, productIds: string[]): Promise<boolean> {
  if (!productIds.length) return true;
  const owned = await prisma.product.count({ where: { vendorId, id: { in: productIds } } });
  return owned === productIds.length;
}

/** Codes are unique across the marketplace (case-insensitively: they're stored upper-case). */
async function codeTaken(code: string, exceptId?: string) {
  const found = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
  return Boolean(found && found.id !== exceptId);
}

function data(values: CouponFormValues) {
  return {
    type: values.type,
    title: values.title,
    code: values.code,
    discountType: values.discountType,
    discount: values.discount,
    maxDiscount: values.maxDiscount,
    minPurchase: values.minPurchase,
    limitPerUser: values.limitPerUser,
    startDate: values.startDate,
    expireDate: values.expireDate,
    appliesTo: values.appliesTo,
  };
}

function revalidateCoupons() {
  revalidatePath("/vendor/coupons");
}

export async function createCoupon(formData: FormData): Promise<CouponActionResult> {
  const user = await requireApprovedVendor();

  const parsed = read(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const values = parsed.data;
  if (values.expireDate < todayUtc()) return { ok: false, fieldErrors: { expireDate: [COUPON_EXPIRED] } };
  if (await codeTaken(values.code)) return { ok: false, fieldErrors: { code: [DUPLICATE_CODE] } };
  if (!(await ownsAllProducts(user.vendor.id, values.productIds))) {
    return { ok: false, fieldErrors: { productIds: [FOREIGN_PRODUCTS] } };
  }

  try {
    // One nested create: the coupon and its product links commit together.
    const coupon = await prisma.coupon.create({
      data: {
        ...data(values),
        vendorId: user.vendor.id,
        status: "ACTIVE",
        products: { create: values.productIds.map((productId) => ({ productId })) },
      },
      select: { id: true },
    });
    revalidateCoupons();
    return { ok: true, message: `Coupon "${values.code}" was created.`, couponId: coupon.id };
  } catch (error) {
    // The unique index is the real guarantee if two saves race.
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { code: [DUPLICATE_CODE] } };
    // A selected product was deleted between the check and the write.
    if (isForeignKeyViolation(error)) return { ok: false, fieldErrors: { productIds: [FOREIGN_PRODUCTS] } };
    console.error("createCoupon failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}

export async function updateCoupon(id: string, formData: FormData): Promise<CouponActionResult> {
  const user = await requireApprovedVendor();
  if (!couponIdSchema.safeParse(id).success) return { ok: false, formError: GONE };

  const existing = await prisma.coupon.findFirst({
    where: { id, vendorId: user.vendor.id },
    select: { expireDate: true, updatedAt: true },
  });
  if (!existing) return { ok: false, formError: GONE };

  // A stale form (another tab, a status toggle) must not overwrite newer changes.
  const version = formData.get("version");
  if (typeof version === "string" && version !== existing.updatedAt.toISOString()) {
    return { ok: false, formError: "This coupon was changed since you opened it. Reload the page and try again." };
  }

  const parsed = read(formData);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const values = parsed.data;
  // An already-past expire date may be kept; it can't be newly set in the past.
  if (values.expireDate.getTime() !== existing.expireDate.getTime() && values.expireDate < todayUtc()) {
    return { ok: false, fieldErrors: { expireDate: [COUPON_EXPIRED] } };
  }
  if (await codeTaken(values.code, id)) return { ok: false, fieldErrors: { code: [DUPLICATE_CODE] } };
  if (!(await ownsAllProducts(user.vendor.id, values.productIds))) {
    return { ok: false, fieldErrors: { productIds: [FOREIGN_PRODUCTS] } };
  }

  try {
    const changed = await prisma.$transaction(async (tx) => {
      // Conditional on the version read above, and on ownership. Status is
      // not part of `data`, so an edit never changes it.
      const { count } = await tx.coupon.updateMany({
        where: { id, vendorId: user.vendor.id, updatedAt: existing.updatedAt },
        data: data(values),
      });
      if (count === 0) return false;
      // Make the links match the submission exactly: drop the ones not
      // selected (all of them for ALL_PRODUCTS), add the new ones.
      await tx.couponProduct.deleteMany({ where: { couponId: id, productId: { notIn: values.productIds } } });
      if (values.productIds.length) {
        await tx.couponProduct.createMany({
          data: values.productIds.map((productId) => ({ couponId: id, productId })),
          skipDuplicates: true,
        });
      }
      return true;
    });
    if (!changed) return { ok: false, formError: "This coupon was just changed elsewhere. Reload the page and try again." };
    revalidateCoupons();
    return { ok: true, message: `Coupon "${values.code}" was updated.`, couponId: id };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { code: [DUPLICATE_CODE] } };
    if (isForeignKeyViolation(error)) return { ok: false, fieldErrors: { productIds: [FOREIGN_PRODUCTS] } };
    console.error("updateCoupon failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}

export async function deleteCoupon(id: string): Promise<FormActionResult> {
  const user = await requireApprovedVendor();
  if (!couponIdSchema.safeParse(id).success) return { ok: false, formError: GONE };

  try {
    const coupon = await prisma.coupon.findFirst({ where: { id, vendorId: user.vendor.id }, select: { code: true } });
    if (!coupon) return { ok: false, formError: GONE };
    const { count } = await prisma.coupon.deleteMany({ where: { id, vendorId: user.vendor.id } });
    if (count === 0) return { ok: false, formError: GONE };
    revalidateCoupons();
    return { ok: true, message: `Coupon "${coupon.code}" was deleted.` };
  } catch (error) {
    console.error("deleteCoupon failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}

/** The list's Status switch. Only changes `status`. */
export async function setCouponStatus(id: string, active: boolean): Promise<FormActionResult> {
  const user = await requireApprovedVendor();
  if (!couponIdSchema.safeParse(id).success || typeof active !== "boolean") return { ok: false, formError: GONE };

  try {
    const coupon = await prisma.coupon.findFirst({ where: { id, vendorId: user.vendor.id }, select: { code: true } });
    if (!coupon) return { ok: false, formError: GONE };
    const { count } = await prisma.coupon.updateMany({
      where: { id, vendorId: user.vendor.id },
      data: { status: active ? "ACTIVE" : "INACTIVE" },
    });
    if (count === 0) return { ok: false, formError: GONE };
    revalidateCoupons();
    return { ok: true, message: `Coupon "${coupon.code}" is now ${active ? "active" : "inactive"}.` };
  } catch (error) {
    console.error("setCouponStatus failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}
