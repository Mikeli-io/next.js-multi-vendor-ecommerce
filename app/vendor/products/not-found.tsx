import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PRODUCTS_CRUMB } from "@/components/products/product-parts";
import { SearchIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth/guards";
import { maskEmail } from "@/lib/format";

/**
 * An unknown product id — or another vendor's: both look the same, so the
 * page never confirms that a product exists in someone else's store.
 */
export default async function ProductNotFound() {
  const user = await getCurrentUser();
  return (
    <DashboardShell
      role="vendor"
      breadcrumb={[PRODUCTS_CRUMB, { label: "Not found" }]}
      user={user ? { name: user.name, subtitle: maskEmail(user.email) } : null}
    >
      <EmptyState
        variant="panel"
        icon={SearchIcon}
        title="Product not found"
        body="This product doesn't exist in your store."
        action={
          <Link href="/vendor/products" className="text-[13.5px] font-semibold">
            Back to Product List
          </Link>
        }
      />
    </DashboardShell>
  );
}
