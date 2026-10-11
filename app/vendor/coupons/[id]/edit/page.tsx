import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ListHeading } from "@/components/catalog/list-parts";
import { CouponForm } from "@/components/coupons/coupon-form";
import { COUPON_ICON, COUPONS_CRUMB } from "@/components/coupons/coupon-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { maskEmail } from "@/lib/format";
import { getCouponProductOptions, getOwnCoupon } from "@/lib/coupons/queries";

export const metadata: Metadata = { title: "Edit Coupon · Covet" };

/** Edit Coupon: the Create form, prefilled from the vendor's own coupon. Its status is changed from the list. */
export default async function EditCouponPage({ params }: PageProps<"/vendor/coupons/[id]/edit">) {
  const user = await requireApprovedVendor();
  const { id } = await params;
  const coupon = await getOwnCoupon(id);
  if (!coupon) notFound();
  const products = await getCouponProductOptions();

  return (
    <DashboardShell
      role="vendor"
      breadcrumb={[COUPONS_CRUMB, { label: "Coupon List", href: "/vendor/coupons" }, { label: coupon.code }]}
      user={{ name: user.name, subtitle: maskEmail(user.email) }}
    >
      <ListHeading title="Edit Coupon" icon={COUPON_ICON} />
      <CouponForm coupon={coupon} products={products} />
    </DashboardShell>
  );
}
