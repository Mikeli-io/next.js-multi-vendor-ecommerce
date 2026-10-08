import "server-only";

import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type {
  CategoryListParams,
  SubCategoryListParams,
  SubSubCategoryListParams,
} from "@/lib/validation/catalog";

/**
 * Admin loaders for the category taxonomy. Each one checks the ADMIN role
 * itself, beside its queries; search and filters run in the database.
 *
 * Child and product counts are derived (`_count`, `groupBy`) — nothing is stored.
 */

type TaxonomyField = "categoryId" | "subCategoryId" | "subSubCategoryId";

/** Products per taxonomy row, by the product column that references it. */
async function productCounts(field: TaxonomyField, ids: string[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map();
  const groups = await prisma.product.groupBy({
    by: [field],
    where: { [field]: { in: ids } },
    _count: { _all: true },
  });
  const counts = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const group of groups) {
    const id = group[field];
    if (id) counts.set(id, group._count._all);
  }
  return counts;
}

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  subCategoryCount: number;
  productCount: number | null;
};

export async function getCategories(params: CategoryListParams) {
  await requireAdmin();

  const where: Prisma.CategoryWhereInput = params.q ? { name: { contains: params.q } } : {};
  const [total, rows] = await Promise.all([
    prisma.category.count(),
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, image: true, _count: { select: { subCategories: true } } },
    }),
  ]);

  const products = await productCounts("categoryId", rows.map((r) => r.id));
  const categories: CategoryRow[] = rows.map(({ _count, ...r }) => ({
    ...r,
    subCategoryCount: _count.subCategories,
    productCount: products.get(r.id) ?? null,
  }));
  return { total, categories };
}

export type SubCategoryRow = {
  id: string;
  name: string;
  category: { id: string; name: string };
  subSubCategoryCount: number;
  productCount: number | null;
};

export async function getSubCategories(params: SubCategoryListParams) {
  await requireAdmin();

  const where: Prisma.SubCategoryWhereInput = {
    ...(params.q ? { name: { contains: params.q } } : {}),
    ...(params.category ? { categoryId: params.category } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.subCategory.count(),
    prisma.subCategory.findMany({
      where,
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        category: { select: { id: true, name: true } },
        _count: { select: { subSubCategories: true } },
      },
    }),
  ]);

  const products = await productCounts("subCategoryId", rows.map((r) => r.id));
  const subCategories: SubCategoryRow[] = rows.map(({ _count, ...r }) => ({
    ...r,
    subSubCategoryCount: _count.subSubCategories,
    productCount: products.get(r.id) ?? null,
  }));
  return { total, subCategories };
}

export type SubSubCategoryRow = {
  id: string;
  name: string;
  subCategory: { id: string; name: string; category: { id: string; name: string } };
  productCount: number | null;
};

export async function getSubSubCategories(params: SubSubCategoryListParams) {
  await requireAdmin();

  const where: Prisma.SubSubCategoryWhereInput = {
    ...(params.q ? { name: { contains: params.q } } : {}),
    ...(params.subCategory ? { subCategoryId: params.subCategory } : {}),
    // Category is derived through the sub category — there is no direct column.
    ...(params.category ? { subCategory: { categoryId: params.category } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.subSubCategory.count(),
    prisma.subSubCategory.findMany({
      where,
      orderBy: [{ subCategory: { category: { name: "asc" } } }, { subCategory: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        subCategory: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const products = await productCounts("subSubCategoryId", rows.map((r) => r.id));
  const subSubCategories: SubSubCategoryRow[] = rows.map((r) => ({
    ...r,
    productCount: products.get(r.id) ?? null,
  }));
  return { total, subSubCategories };
}

export type CategoryOption = {
  id: string;
  name: string;
  subCategories: { id: string; name: string }[];
};

/**
 * Every category with its sub categories, for the form dropdowns and list
 * filters. The dependent Sub Category dropdown filters this client-side; the
 * server re-validates the pairing on submit.
 */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  await requireAdmin();
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subCategories: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
}
