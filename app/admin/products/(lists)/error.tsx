"use client";

import { ADMIN_PRODUCT_ICON, PRODUCT_MANAGE_CRUMB } from "@/components/admin-products/admin-product-parts";
import { CatalogError } from "@/components/catalog/catalog-error";

export default function ProductListError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <CatalogError {...props} heading="Products" icon={ADMIN_PRODUCT_ICON} title="Couldn't load products" breadcrumb={[PRODUCT_MANAGE_CRUMB, { label: "Products" }]} />;
}
