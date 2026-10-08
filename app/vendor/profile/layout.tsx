import { requireApprovedVendor } from "@/lib/auth/guards";

/**
 * Profile Settings: the signed-in vendor's own account. Access is resolved
 * here, before either tab's `loading.tsx` streams, so a non-vendor (or a store
 * that is not approved) gets a real redirect. The pages' loader and both
 * Server Actions check again — layouts don't re-run on client navigation.
 */
export default async function VendorProfileLayout({ children }: LayoutProps<"/vendor/profile">) {
  await requireApprovedVendor();
  return children;
}
