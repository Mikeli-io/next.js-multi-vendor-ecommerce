"use client";

import { CatalogError } from "@/components/catalog/catalog-error";
import { SETUP_CRUMB, TAXONOMY_ICON } from "@/components/categories/taxonomy-parts";

export default function ListError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <CatalogError
      {...props}
      heading="Sub Sub Categories"
      icon={TAXONOMY_ICON}
      title="Couldn't load sub sub categories"
      breadcrumb={[SETUP_CRUMB, { label: "Sub Sub Categories" }]}
    />
  );
}
