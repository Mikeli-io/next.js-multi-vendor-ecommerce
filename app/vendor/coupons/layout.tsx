import { requireApprovedVendor } from "@/lib/auth/guards";

/**
 * Vendor Coupon Management. Access is resolved here, before any segment's
 * `loading.tsx` streams, so a non-vendor (or a store that is not APPROVED)
 * gets a real redirect. Every loader and Server Action checks again and
 * scopes its queries to this vendor.
 */
export default async function VendorCouponsLayout({ children }: LayoutProps<"/vendor/coupons">) {
  await requireApprovedVendor();
  return children;
}
