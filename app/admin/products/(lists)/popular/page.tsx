import type { Metadata } from "next";

import { AdminProductList } from "@/components/admin-products/admin-product-list";

export const metadata: Metadata = { title: "Popular Products · Covet admin" };

export default async function PopularProductsPage({ searchParams }: PageProps<"/admin/products/popular">) {
  return <AdminProductList view="popular" searchParams={await searchParams} />;
}
