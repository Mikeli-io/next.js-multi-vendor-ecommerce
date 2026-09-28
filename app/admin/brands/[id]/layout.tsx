import { notFound } from "next/navigation";

import { getBrand } from "@/lib/brands/queries";
import { brandIdSchema } from "@/lib/validation/brand";

/**
 * Resolves whether the brand exists *before* this segment's `loading.tsx`
 * streams. From the page, `notFound()` could only render the not-found UI
 * under a 200 status; from here it is a real 404. `getBrand` is memoized per
 * request, so the page reuses this lookup rather than querying twice.
 *
 * `notFound()` here is handled by `app/admin/brands/not-found.tsx`.
 */
export default async function BrandLayout({ children, params }: LayoutProps<"/admin/brands/[id]">) {
  const { id } = await params;
  if (!brandIdSchema.safeParse(id).success) notFound();
  if (!(await getBrand(id))) notFound();
  return children;
}
