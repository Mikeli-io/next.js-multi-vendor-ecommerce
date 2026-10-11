import type { Metadata } from "next";

import { AdminProductList } from "@/components/admin-products/admin-product-list";

export const metadata: Metadata = { title: "Rejected Products · Covet admin" };

export default async function RejectedProductsPage({ searchParams }: PageProps<"/admin/products/rejected">) {
  return <AdminProductList view="rejected" searchParams={await searchParams} />;
}
