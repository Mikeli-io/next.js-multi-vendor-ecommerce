import type { Metadata } from "next";

import { AdminProductList } from "@/components/admin-products/admin-product-list";

export const metadata: Metadata = { title: "Approved Products · Covet admin" };

export default async function ApprovedProductsPage({ searchParams }: PageProps<"/admin/products/approved">) {
  return <AdminProductList view="approved" searchParams={await searchParams} />;
}
