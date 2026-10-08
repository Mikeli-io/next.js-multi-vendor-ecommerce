import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormHeading } from "@/components/products/form-heading";
import { ProductForm } from "@/components/products/product-form";
import { PRODUCTS_CRUMB } from "@/components/products/product-parts";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { maskEmail } from "@/lib/format";
import { getProductFormOptions } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Add New Product · Covet" };

/** Add New Product, after VendorAddProduct.dc.html. New products start active and pending approval. */
export default async function NewProductPage() {
  const user = await requireApprovedVendor();
  const { categories, brands } = await getProductFormOptions();

  return (
    <DashboardShell role="vendor" breadcrumb={[PRODUCTS_CRUMB, { label: "Add New Product" }]} user={{ name: user.name, subtitle: maskEmail(user.email) }}>
      <FormHeading title="Add New Product" subtitle="New products are reviewed by the Covet team before they appear in the store." />
      <ProductForm categories={categories} brands={brands} />
    </DashboardShell>
  );
}
