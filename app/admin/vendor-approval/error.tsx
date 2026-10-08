"use client";

import { CatalogError } from "@/components/catalog/catalog-error";
import { VENDOR_ICON, VENDOR_MANAGE_CRUMB } from "@/components/vendors/vendor-parts";

export default function ListError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <CatalogError {...props} heading="Vendor Approval" icon={VENDOR_ICON} title="Couldn't load the approval queue" breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Vendor Approval" }]} />
  );
}
