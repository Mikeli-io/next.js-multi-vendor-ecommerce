import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormHeading } from "@/components/products/form-heading";
import { ProductForm } from "@/components/products/product-form";
import { PRODUCTS_CRUMB } from "@/components/products/product-parts";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { maskEmail } from "@/lib/format";
import { getOwnProduct, getProductFormOptions } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Edit Product · Covet" };

/**
 * Edit Product: the Add form, prefilled from the vendor's own product
 * (variations, images and taxonomy included). Saving keeps the approval
 * status and the active switch as they are.
 */
export default async function EditProductPage({ params }: PageProps<"/vendor/products/[id]/edit">) {
  const user = await requireApprovedVendor();
  const { id } = await params;
  const product = await getOwnProduct(id);
  if (!product) notFound();
  // Keep the product's current brand selectable even if it was deactivated since.
  const { categories, brands } = await getProductFormOptions(product.brand?.id);

  return (
    <DashboardShell
      role="vendor"
      breadcrumb={[PRODUCTS_CRUMB, { label: product.name, href: `/vendor/products/${product.id}` }, { label: "Edit" }]}
      user={{ name: user.name, subtitle: maskEmail(user.email) }}
    >
      <FormHeading title="Edit Product" subtitle={product.name} />
      <ProductForm product={product} categories={categories} brands={brands} />
    </DashboardShell>
  );
}
