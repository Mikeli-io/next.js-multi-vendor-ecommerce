"use client";

import { CouponError } from "@/components/coupons/coupon-error";

export default function CouponErrorPage(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <CouponError {...props} heading="Edit Coupon" title="Couldn't load this coupon" />;
}
