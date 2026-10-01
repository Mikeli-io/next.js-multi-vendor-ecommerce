"use client";

import { BRAND_BREADCRUMB } from "@/components/brands/brand-list-parts";
import { CatalogError } from "@/components/catalog/catalog-error";
import { TagIcon } from "@/components/ui/icons";

export default function BrandDetailsError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <CatalogError
      {...props}
      heading="Brands"
      icon={TagIcon}
      title="Couldn't load this brand"
      breadcrumb={[...BRAND_BREADCRUMB, { label: "Brands", href: "/admin/brands" }]}
    />
  );
}
