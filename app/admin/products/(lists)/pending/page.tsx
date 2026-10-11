import type { Metadata } from "next";

import { AdminProductList } from "@/components/admin-products/admin-product-list";

export const metadata: Metadata = { title: "Pending Products · Covet admin" };

export default async function PendingProductsPage({ searchParams }: PageProps<"/admin/products/pending">) {
  return <AdminProductList view="pending" searchParams={await searchParams} />;
}
