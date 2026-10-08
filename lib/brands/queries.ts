import "server-only";

import { cache } from "react";
import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { BrandListParams, BrandStatusValue } from "@/lib/validation/brand";

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  status: BrandStatusValue;
  createdAt: Date;
  productCount: number;
};

/** Products per brand, derived from the Product → Brand relation. */
async function getBrandProductCounts(brandIds: string[]): Promise<Map<string, number>> {
  if (!brandIds.length) return new Map();
  const groups = await prisma.product.groupBy({
    by: ["brandId"],
    where: { brandId: { in: brandIds } },
    _count: { _all: true },
  });
  const counts = new Map<string, number>(brandIds.map((id) => [id, 0]));
  for (const group of groups) if (group.brandId) counts.set(group.brandId, group._count._all);
  return counts;
}

const SELECT = {
  id: true,
  name: true,
  slug: true,
  image: true,
  status: true,
  createdAt: true,
} satisfies Prisma.BrandSelect;

/**
 * The admin brand list, searched and filtered in the database from URL params.
 * `total` is every brand (for the header badge); `brands` is the filtered set.
 */
export async function getBrands(params: BrandListParams) {
  await requireAdmin();

  const where: Prisma.BrandWhereInput = {
    ...(params.q ? { name: { contains: params.q } } : {}),
    ...(params.status === "active" ? { status: "ACTIVE" } : {}),
    ...(params.status === "inactive" ? { status: "INACTIVE" } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.brand.count(),
    prisma.brand.findMany({ where, select: SELECT, orderBy: { name: "asc" } }),
  ]);

  const counts = await getBrandProductCounts(rows.map((r) => r.id));
  const brands: BrandRow[] = rows.map((r) => ({
    ...r,
    productCount: counts.get(r.id) ?? 0,
  }));

  return { total, brands };
}

/**
 * One brand for the details page, or `null` if it does not exist. Memoized per
 * request: the segment layout and the page both ask for it.
 */
export const getBrand = cache(async (id: string): Promise<BrandRow | null> => {
  await requireAdmin();

  const row = await prisma.brand.findUnique({ where: { id }, select: SELECT });
  if (!row) return null;

  const counts = await getBrandProductCounts([row.id]);
  return { ...row, productCount: counts.get(row.id) ?? 0 };
});

/** How many products use a brand, for the delete guard. */
export async function countBrandProducts(id: string): Promise<number> {
  return (await getBrandProductCounts([id])).get(id) ?? 0;
}
