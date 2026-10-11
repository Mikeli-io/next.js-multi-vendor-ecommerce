import type { Metadata } from "next";

import { AdminProductList } from "@/components/admin-products/admin-product-list";

export const metadata: Metadata = { title: "Featured Products · Covet admin" };

export default async function FeaturedProductsPage({ searchParams }: PageProps<"/admin/products/featured">) {
  return <AdminProductList view="featured" searchParams={await searchParams} />;
}
