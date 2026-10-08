import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormHeading } from "@/components/products/form-heading";
import { ProductFormSkeleton } from "@/components/products/product-form-skeleton";
import { PRODUCTS_CRUMB } from "@/components/products/product-parts";

export default function Loading() {
  return (
    <DashboardShell role="vendor" breadcrumb={[PRODUCTS_CRUMB, { label: "Edit" }]}>
      <FormHeading title="Edit Product" />
      <ProductFormSkeleton />
    </DashboardShell>
  );
}
