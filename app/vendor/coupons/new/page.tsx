import type { Metadata } from "next";

import { ListHeading } from "@/components/catalog/list-parts";
import { CouponForm } from "@/components/coupons/coupon-form";
import { COUPON_ICON, COUPONS_CRUMB } from "@/components/coupons/coupon-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { getCouponProductOptions } from "@/lib/coupons/queries";
import { maskEmail } from "@/lib/format";

export const metadata: Metadata = { title: "Create Coupon · Covet" };

/**
 * Create Coupon — the setup card of VendorCoupon.dc.html on its own page
 * (the design puts it above the list; here the two are separate routes).
 * New coupons are ACTIVE.
 */
export default async function NewCouponPage() {
  const user = await requireApprovedVendor();
  // Only this vendor's products, for the "Specific products" picker.
  const products = await getCouponProductOptions();
  return (
    <DashboardShell role="vendor" breadcrumb={[COUPONS_CRUMB, { label: "Create Coupon" }]} user={{ name: user.name, subtitle: maskEmail(user.email) }}>
      <ListHeading title="Create Coupon" icon={COUPON_ICON} />
      <CouponForm products={products} />
    </DashboardShell>
  );
}
