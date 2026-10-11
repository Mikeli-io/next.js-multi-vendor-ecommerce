import "server-only";

import { cache } from "react";
import type { CouponAppliesTo, CouponStatus, CouponType, Prisma, ProductApprovalStatus, ProductDiscountType } from "@prisma/client";

import { requireApprovedVendor } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { CouponListParams } from "@/lib/validation/coupon";

/**
 * Vendor coupon queries. Each resolves the APPROVED vendor from the session
 * and filters by that vendor's id in the query itself — another vendor's
 * coupons are never loaded. Money leaves as decimal strings, dates as
 * `YYYY-MM-DD`.
 */

export const COUPON_PAGE_SIZE = 10;

export type CouponRow = {
  id: string;
  type: CouponType;
  title: string;
  code: string;
  discountType: ProductDiscountType | null;
  discount: string | null;
  maxDiscount: string | null;
  minPurchase: string;
  limitPerUser: number;
  startDate: string;
  expireDate: string;
  status: CouponStatus;
  appliesTo: CouponAppliesTo;
  /** The linked products (SPECIFIC_PRODUCTS only; always [] for ALL_PRODUCTS), by name. */
  products: { id: string; name: string }[];
  updatedAt: string;
};

const SELECT = {
  id: true,
  type: true,
  title: true,
  code: true,
  discountType: true,
  discount: true,
  maxDiscount: true,
  minPurchase: true,
  limitPerUser: true,
  startDate: true,
  expireDate: true,
  status: true,
  appliesTo: true,
  products: { select: { product: { select: { id: true, name: true } } }, orderBy: { product: { name: "asc" } } },
  updatedAt: true,
} satisfies Prisma.CouponSelect;

const day = (date: Date) => date.toISOString().slice(0, 10);

function toRow(c: Prisma.CouponGetPayload<{ select: typeof SELECT }>): CouponRow {
  return {
    ...c,
    discount: c.discount?.toFixed(2) ?? null,
    maxDiscount: c.maxDiscount?.toFixed(2) ?? null,
    minPurchase: c.minPurchase.toFixed(2),
    startDate: day(c.startDate),
    expireDate: day(c.expireDate),
    products: c.products.map((link) => link.product),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** One page of the vendor's coupons; the search narrows within them (title or code). */
export async function getOwnCoupons(params: CouponListParams) {
  const user = await requireApprovedVendor();
  const own: Prisma.CouponWhereInput = { vendorId: user.vendor.id };
  const where: Prisma.CouponWhereInput = params.q
    ? { AND: [own, { OR: [{ title: { contains: params.q } }, { code: { contains: params.q } }] }] }
    : own;

  const [total, matching] = await Promise.all([prisma.coupon.count({ where: own }), prisma.coupon.count({ where })]);
  const pageCount = Math.max(1, Math.ceil(matching / COUPON_PAGE_SIZE));
  const page = Math.min(params.page, pageCount);
  const rows = await prisma.coupon.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * COUPON_PAGE_SIZE,
    take: COUPON_PAGE_SIZE,
    select: SELECT,
  });
  return { total, matching, page, pageCount, pageSize: COUPON_PAGE_SIZE, coupons: rows.map(toRow) };
}

/**
 * The vendor's own coupon, or null — for an unknown id and for another
 * vendor's coupon alike, so the response never reveals that it exists.
 */
export const getOwnCoupon = cache(async (id: string): Promise<CouponRow | null> => {
  const user = await requireApprovedVendor();
  const row = await prisma.coupon.findFirst({ where: { id, vendorId: user.vendor.id }, select: SELECT });
  return row ? toRow(row) : null;
});

export type CouponProductOption = {
  id: string;
  name: string;
  sku: string | null;
  thumbnail: string | null;
  isActive: boolean;
  approvalStatus: ProductApprovalStatus;
};

/**
 * The signed-in vendor's products for the coupon's product selector — only
 * their own, never another store's. Inactive and pending products are
 * included: a coupon may be set up before a product goes live.
 */
export async function getCouponProductOptions(): Promise<CouponProductOption[]> {
  const user = await requireApprovedVendor();
  return prisma.product.findMany({
    where: { vendorId: user.vendor.id },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true, sku: true, thumbnail: true, isActive: true, approvalStatus: true },
  });
}
