import { requireApprovedVendor } from "@/lib/auth/guards";

/**
 * Vendor Product Management. Access is resolved here, before any segment's
 * `loading.tsx` streams, so a non-vendor (or a store that is not APPROVED)
 * gets a real redirect. Every loader and Server Action checks again and
 * scopes its queries to this vendor — layouts don't re-run on client
 * navigation, and actions can be called without any page.
 */
export default async function VendorProductsLayout({ children }: LayoutProps<"/vendor/products">) {
  await requireApprovedVendor();
  return children;
}
