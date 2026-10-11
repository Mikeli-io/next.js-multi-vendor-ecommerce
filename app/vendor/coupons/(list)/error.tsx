"use client";

import { CouponError } from "@/components/coupons/coupon-error";

export default function CouponErrorPage(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <CouponError {...props} heading="Coupon List" title="Couldn't load coupons" />;
}
