import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchIcon } from "@/components/ui/icons";
import { VENDOR_MANAGE_CRUMB } from "@/components/vendors/vendor-parts";
import { getCurrentUser } from "@/lib/auth/guards";

/** `notFound()` from a vendor detail route — an unknown vendor id. */
export default async function VendorNotFound() {
  const user = await getCurrentUser();
  return (
    <DashboardShell
      role="admin"
      breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Vendor List", href: "/admin/vendors" }]}
      user={user ? { name: user.name, subtitle: "Master Admin" } : null}
    >
      <EmptyState
        variant="panel"
        icon={SearchIcon}
        title="Vendor not found"
        body="This vendor doesn't exist."
        action={
          <Link href="/admin/vendors" className="text-[13.5px] font-semibold">
            Back to Vendor List
          </Link>
        }
      />
    </DashboardShell>
  );
}
