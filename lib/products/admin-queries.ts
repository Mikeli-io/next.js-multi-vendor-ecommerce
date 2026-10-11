import "server-only";

import { cache } from "react";
import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { galleryPaths, type ProductDetail } from "@/lib/products/queries";
import { productStock } from "@/lib/products/stock";
import type { AdminProductListParams, AdminProductView } from "@/lib/validation/admin-product";

/**
 * Admin Product Management queries. Every one checks the ADMIN role itself,
 * beside its queries (the pages and the admin layout check too). They read
 * vendors' existing products — nothing is created or copied.
 */

export const ADMIN_PRODUCT_PAGE_SIZE = 10;

/** Which products each list shows. Featured/Popular are always APPROVED-only. */
export const VIEW_WHERE: Record<AdminProductView, Prisma.ProductWhereInput> = {
  pending: { approvalStatus: "PENDING" },
  approved: { approvalStatus: "APPROVED" },
  rejected: { approvalStatus: "REJECTED" },
  featured: { approvalStatus: "APPROVED", isFeatured: true },
  popular: { approvalStatus: "APPROVED", isPopular: true },
};

export type AdminProductRow = {
  id: string;
  name: string;
  sku: string | null;
  thumbnail: string | null;
  price: string;
  variationPrice: { min: string; max: string } | null;
  stock: number;
  variationCount: number;
  approvalStatus: ProductDetail["approvalStatus"];
  isActive: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  createdAt: Date;
  vendor: { id: string; storeName: string };
};

/** One page of a moderation list; the search (name, SKU or store) narrows within the view. */
export async function getAdminProducts(view: AdminProductView, params: AdminProductListParams) {
  await requireAdmin();
  const base = VIEW_WHERE[view];
  const where: Prisma.ProductWhereInput = params.q
    ? {
        AND: [
          base,
          { OR: [{ name: { contains: params.q } }, { sku: { contains: params.q } }, { vendor: { storeName: { contains: params.q } } }] },
        ],
      }
    : base;

  const [total, matching] = await Promise.all([prisma.product.count({ where: base }), prisma.product.count({ where })]);
  const pageCount = Math.max(1, Math.ceil(matching / ADMIN_PRODUCT_PAGE_SIZE));
  const page = Math.min(params.page, pageCount);
  const rows = await prisma.product.findMany({
    where,
    // Review queue oldest first (first come, first reviewed); the others newest first.
    orderBy: view === "pending" ? [{ createdAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_PRODUCT_PAGE_SIZE,
    take: ADMIN_PRODUCT_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      sku: true,
      thumbnail: true,
      price: true,
      stock: true,
      approvalStatus: true,
      isActive: true,
      isFeatured: true,
      isPopular: true,
      createdAt: true,
      vendor: { select: { id: true, storeName: true } },
      variations: { select: { stock: true, price: true } },
    },
  });

  const products: AdminProductRow[] = rows.map((row) => {
    const prices = row.variations.map((v) => v.price);
    const min = prices.reduce<Prisma.Decimal | null>((a, p) => (a === null || p.lessThan(a) ? p : a), null);
    const max = prices.reduce<Prisma.Decimal | null>((a, p) => (a === null || p.greaterThan(a) ? p : a), null);
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      thumbnail: row.thumbnail,
      price: row.price.toFixed(2),
      variationPrice: min && max ? { min: min.toFixed(2), max: max.toFixed(2) } : null,
      stock: productStock(row),
      variationCount: row.variations.length,
      approvalStatus: row.approvalStatus,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      isPopular: row.isPopular,
      createdAt: row.createdAt,
      vendor: row.vendor,
    };
  });
  return { total, matching, page, pageCount, pageSize: ADMIN_PRODUCT_PAGE_SIZE, products };
}

/** How many products each list holds, for the sidebar-independent view tabs. */
export async function getAdminProductCounts(): Promise<Record<AdminProductView, number>> {
  await requireAdmin();
  const entries = await Promise.all(
    (Object.keys(VIEW_WHERE) as AdminProductView[]).map(async (view) => [view, await prisma.product.count({ where: VIEW_WHERE[view] })] as const),
  );
  return Object.fromEntries(entries) as Record<AdminProductView, number>;
}

export type AdminProductDetail = ProductDetail & {
  isFeatured: boolean;
  isPopular: boolean;
  vendor: { id: string; storeName: string; status: string; productCount: number };
};

/** One product for the admin details page, or null. Memoized per request (layout + page). */
export const getAdminProduct = cache(async (id: string): Promise<AdminProductDetail | null> => {
  await requireAdmin();
  const row = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, storeName: true, status: true, _count: { select: { products: true } } } },
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      subSubCategory: { select: { id: true, name: true } },
      variations: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    shortDescription: row.shortDescription,
    description: row.description,
    brand: row.brand,
    category: row.category,
    subCategory: row.subCategory,
    subSubCategory: row.subSubCategory,
    price: row.price.toFixed(2),
    compareAtPrice: row.compareAtPrice?.toFixed(2) ?? null,
    discount: row.discount?.toFixed(2) ?? null,
    discountType: row.discountType,
    taxRate: row.taxRate?.toFixed(2) ?? null,
    simpleStock: row.stock,
    stock: productStock(row),
    thumbnail: row.thumbnail,
    gallery: galleryPaths(row.gallery),
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    approvalStatus: row.approvalStatus,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    isPopular: row.isPopular,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    vendor: { id: row.vendor.id, storeName: row.vendor.storeName, status: row.vendor.status, productCount: row.vendor._count.products },
    variations: row.variations.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price.toFixed(2),
      stock: v.stock,
      image: v.image,
      attributes:
        v.attributes && typeof v.attributes === "object" && !Array.isArray(v.attributes)
          ? Object.fromEntries(Object.entries(v.attributes).filter((e): e is [string, string] => typeof e[1] === "string"))
          : {},
    })),
  };
});
