"use client";

import { CatalogError } from "@/components/catalog/catalog-error";
import { VENDOR_ICON, VENDOR_MANAGE_CRUMB } from "@/components/vendors/vendor-parts";

export default function AddVendorError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <CatalogError {...props} heading="Add New Vendor" icon={VENDOR_ICON} title="Couldn't load the form" breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Add New Vendor" }]} />
  );
}
