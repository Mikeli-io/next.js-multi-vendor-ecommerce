import { requireApprovedVendor } from "@/lib/auth/guards";

/**
 * Resolves access *before* this segment's `loading.tsx` boundary starts
 * streaming. A layout sits outside its own loading boundary, so a redirect
 * thrown here is still a real HTTP redirect; thrown from the page, after the
 * skeleton has been sent, it could only be a client-side refresh — leaving a
 * pending vendor looking at a dashboard skeleton for a moment.
 *
 * This is not the only check: the page's loader calls the same guard, and
 * layouts do not re-run on client-side navigation. The result is memoized per
 * request, so the second call costs nothing.
 */
export default async function VendorDashboardLayout({
  children,
}: LayoutProps<"/vendor/dashboard">) {
  await requireApprovedVendor();
  return children;
}
