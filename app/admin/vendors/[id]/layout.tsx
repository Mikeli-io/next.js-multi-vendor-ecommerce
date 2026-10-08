import { notFound } from "next/navigation";

import { vendorIdSchema } from "@/lib/validation/vendor";
import { getVendor } from "@/lib/vendors/queries";

/**
 * Resolves whether the vendor exists before `loading.tsx` streams, so a
 * missing id is a real 404 (handled by app/admin/vendors/not-found.tsx).
 * `getVendor` is memoized per request; the page reuses this lookup.
 */
export default async function VendorLayout({ children, params }: LayoutProps<"/admin/vendors/[id]">) {
  const { id } = await params;
  if (!vendorIdSchema.safeParse(id).success) notFound();
  if (!(await getVendor(id))) notFound();
  return children;
}
