import type { Metadata } from "next";

import { ListHeading } from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AddVendorForm } from "@/components/vendors/add-vendor-form";
import { VENDOR_ICON, VENDOR_MANAGE_CRUMB } from "@/components/vendors/vendor-parts";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Add New Vendor · Covet admin" };

/**
 * Admin-created vendor account + store, after AdminAddVendor.dc.html. The
 * design's preview-state tabs (loading / empty / error) are not built: this is
 * a blank form with nothing to load. The page guard is one boundary; the
 * `createVendor` Server Action checks ADMIN again, since it is callable on its own.
 */
export default async function AddVendorPage() {
  const admin = await requireAdmin();

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Add New Vendor" }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <ListHeading title="Add New Vendor" icon={VENDOR_ICON} />
      <AddVendorForm />
    </DashboardShell>
  );
}
