import Link from "next/link";

import { PRODUCT_MANAGE_CRUMB } from "@/components/admin-products/admin-product-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth/guards";

/** An unknown or malformed product id under Admin Product Management. */
export default async function AdminProductNotFound() {
  const user = await getCurrentUser();
  return (
    <DashboardShell role="admin" breadcrumb={[PRODUCT_MANAGE_CRUMB, { label: "Not found" }]} user={user ? { name: user.name, subtitle: "Master Admin" } : null}>
      <EmptyState
        variant="panel"
        icon={SearchIcon}
        title="Product not found"
        body="We couldn't find details for this product."
        action={
          <Link href="/admin/products/pending" className="text-[13.5px] font-semibold">
            Back to Pending Products
          </Link>
        }
      />
    </DashboardShell>
  );
}
