import { notFound } from "next/navigation";

import { getOwnCoupon } from "@/lib/coupons/queries";
import { couponIdSchema } from "@/lib/validation/coupon";

/**
 * Resolves the coupon before `loading.tsx` streams, so an unknown id — or
 * another vendor's coupon, which the vendor-scoped query can't see — is a
 * real 404. `getOwnCoupon` is memoized; the page reuses this lookup.
 */
export default async function CouponLayout({ children, params }: LayoutProps<"/vendor/coupons/[id]">) {
  const { id } = await params;
  if (!couponIdSchema.safeParse(id).success) notFound();
  if (!(await getOwnCoupon(id))) notFound();
  return children;
}
