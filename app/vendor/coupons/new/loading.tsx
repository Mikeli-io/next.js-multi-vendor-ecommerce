import { ListHeading } from "@/components/catalog/list-parts";
import { CouponFormSkeleton } from "@/components/coupons/coupon-form-skeleton";
import { COUPON_ICON, COUPONS_CRUMB } from "@/components/coupons/coupon-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Loading() {
  return (
    <DashboardShell role="vendor" breadcrumb={[COUPONS_CRUMB, { label: "Create Coupon" }]}>
      <ListHeading title="Create Coupon" icon={COUPON_ICON} />
      <CouponFormSkeleton />
    </DashboardShell>
  );
}
