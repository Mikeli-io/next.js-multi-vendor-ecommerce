import { notFound } from "next/navigation";

import { getAdminProduct } from "@/lib/products/admin-queries";
import { productIdSchema } from "@/lib/validation/product";

/** Resolves the product before `loading.tsx` streams, so an unknown or malformed id is a real 404. */
export default async function AdminProductLayout({ children, params }: LayoutProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!productIdSchema.safeParse(id).success) notFound();
  if (!(await getAdminProduct(id))) notFound();
  return children;
}
