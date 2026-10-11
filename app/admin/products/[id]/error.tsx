"use client";

import { ADMIN_PRODUCT_ICON, PRODUCT_MANAGE_CRUMB } from "@/components/admin-products/admin-product-parts";
import { CatalogError } from "@/components/catalog/catalog-error";

export default function ProductDetailsError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <CatalogError {...props} heading="Product Details" icon={ADMIN_PRODUCT_ICON} title="Couldn't load product" breadcrumb={[PRODUCT_MANAGE_CRUMB, { label: "Product Details" }]} />;
}
