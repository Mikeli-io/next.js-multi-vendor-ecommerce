import "server-only";

import { cache } from "react";
import type { Prisma, ProductApprovalStatus, ProductDiscountType } from "@prisma/client";

import { requireApprovedVendor } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { Attributes } from "@/lib/products/variations";
import { productStock } from "@/lib/products/stock";
import type { ProductListParams } from "@/lib/validation/product";

/**
 * Vendor product queries. Every one resolves the APPROVED vendor from the
 * session (`requireApprovedVendor`) and filters by that vendor's id in the
 * query itself, so another vendor's products are never loaded — not even to
 * be filtered out later. Money leaves here as decimal strings.
 */

// ---- Form options ------------------------------------------------------------

export type TaxonomyOption = {
  id: string;
  name: string;
  subCategories: { id: string; name: string; subSubCategories: { id: string; name: string }[] }[];
};
export type BrandOption = { id: string; name: string };

/**
 * Categories with their sub and sub sub categories, and the brands a product
 * may use (ACTIVE ones, plus `keepBrandId` — a product's current brand, even
 * if it has since been deactivated, so editing doesn't silently drop it).
 */
export async function getProductFormOptions(keepBrandId?: string | null) {
  await requireApprovedVendor();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        subCategories: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            subSubCategories: { orderBy: { name: "asc" }, select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.brand.findMany({
      where: { OR: [{ status: "ACTIVE" }, ...(keepBrandId ? [{ id: keepBrandId }] : [])] },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { categories: categories as TaxonomyOption[], brands: brands as BrandOption[] };
}

// ---- List --------------------------------------------------------------------

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  thumbnail: string | null;
  price: string;
  /** Lowest and highest variation price; null for a simple product. */
  variationPrice: { min: string; max: string } | null;
  stock: number;
  variationCount: number;
  approvalStatus: ProductApprovalStatus;
  isActive: boolean;
  createdAt: Date;
};

export async function getOwnProducts(params: ProductListParams): Promise<{ total: number; products: ProductRow[] }> {
  const user = await requireApprovedVendor();
  const own: Prisma.ProductWhereInput = { vendorId: user.vendor.id };
  // The search narrows *within* the vendor's products; it can never widen them.
  const where: Prisma.ProductWhereInput = params.q ? { AND: [own, { name: { contains: params.q } }] } : own;

  const [total, rows] = await Promise.all([
    prisma.product.count({ where: own }),
    prisma.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        sku: true,
        thumbnail: true,
        price: true,
        stock: true,
        approvalStatus: true,
        isActive: true,
        createdAt: true,
        variations: { select: { stock: true, price: true } },
      },
    }),
  ]);

  return {
    total,
    products: rows.map((row) => {
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
        createdAt: row.createdAt,
      };
    }),
  };
}

// ---- One product -------------------------------------------------------------

export type ProductVariationDetail = {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  stock: number;
  image: string | null;
  attributes: Attributes;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  shortDescription: string | null;
  description: string;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string };
  subCategory: { id: string; name: string } | null;
  subSubCategory: { id: string; name: string } | null;
  price: string;
  compareAtPrice: string | null;
  discount: string | null;
  discountType: ProductDiscountType;
  taxRate: string | null;
  /** `Product.stock` as stored — only meaningful for a simple product. */
  simpleStock: number;
  /** The available stock (variation sum when variations exist). */
  stock: number;
  thumbnail: string | null;
  gallery: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  approvalStatus: ProductApprovalStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variations: ProductVariationDetail[];
};

/** A stored `gallery` JSON value as a clean string[] (anything else → []). */
export function galleryPaths(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function attributesOf(value: Prisma.JsonValue): Attributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((e): e is [string, string] => typeof e[1] === "string"));
}

/**
 * The signed-in vendor's own product, or null — for an unknown id and for
 * another vendor's product alike, so the response never reveals that a
 * product exists elsewhere. Memoized per request (layout + page share it).
 */
export const getOwnProduct = cache(async (id: string): Promise<ProductDetail | null> => {
  const user = await requireApprovedVendor();
  const row = await prisma.product.findFirst({
    where: { id, vendorId: user.vendor.id },
    include: {
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    variations: row.variations.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price.toFixed(2),
      stock: v.stock,
      image: v.image,
      attributes: attributesOf(v.attributes),
    })),
  };
});
