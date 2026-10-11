import Link from "next/link";

import { COUPONS_CRUMB } from "@/components/coupons/coupon-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth/guards";
import { maskEmail } from "@/lib/format";

/** An unknown coupon id — or another vendor's: both look the same. */
export default async function CouponNotFound() {
  const user = await getCurrentUser();
  return (
    <DashboardShell
      role="vendor"
      breadcrumb={[COUPONS_CRUMB, { label: "Not found" }]}
      user={user ? { name: user.name, subtitle: maskEmail(user.email) } : null}
    >
      <EmptyState
        variant="panel"
        icon={SearchIcon}
        title="Coupon not found"
        body="This coupon doesn't exist in your store."
        action={
          <Link href="/vendor/coupons" className="text-[13.5px] font-semibold">
            Back to Coupon List
          </Link>
        }
      />
    </DashboardShell>
  );
}
