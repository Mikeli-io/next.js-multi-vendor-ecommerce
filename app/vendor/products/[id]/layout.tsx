import { notFound } from "next/navigation";

import { getOwnProduct } from "@/lib/products/queries";
import { productIdSchema } from "@/lib/validation/product";

/**
 * Resolves the product before `loading.tsx` streams, so an unknown id — or
 * another vendor's product, which the vendor-scoped query can't see — is a
 * real 404. `getOwnProduct` is memoized; the pages reuse this lookup.
 */
export default async function ProductLayout({ children, params }: LayoutProps<"/vendor/products/[id]">) {
  const { id } = await params;
  if (!productIdSchema.safeParse(id).success) notFound();
  if (!(await getOwnProduct(id))) notFound();
  return children;
}
