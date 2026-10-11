import { Badge } from "@/components/ui/badge";
import { BoxIcon } from "@/components/ui/icons";
import type { AdminProductView } from "@/lib/validation/admin-product";

/** Shared pieces of Admin Product Management (the five lists and the details page). */

export const ADMIN_PRODUCT_ICON = BoxIcon;

export const PRODUCT_MANAGE_CRUMB = { label: "Product Manage", href: "/admin/products/pending" };

export const VIEW_META: Record<AdminProductView, { title: string; empty: string }> = {
  pending: { title: "Pending Products", empty: "No products are waiting for review." },
  approved: { title: "Approved Products", empty: "No approved products yet." },
  rejected: { title: "Rejected Products", empty: "No rejected products." },
  featured: { title: "Featured Products", empty: "No featured products. Mark approved products as Featured on their details page." },
  popular: { title: "Popular Products", empty: "No popular products. Mark approved products as Popular on their details page." },
};

/** Featured / Popular as small badges, or a muted dash when neither is set. */
export function MerchandisingBadges({ featured, popular }: { featured: boolean; popular: boolean }) {
  if (!featured && !popular) return <span className="text-muted-soft">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {featured ? <Badge tone="accent">Featured</Badge> : null}
      {popular ? <Badge tone="info">Popular</Badge> : null}
    </span>
  );
}

const ROW = "items-center gap-[14px] px-[18px]";

/** After AdminVendorProductList.dc.html (Product Type, edit and delete left out: no such data/feature). */
export const ADMIN_PRODUCT_TABLE = {
  columns: `grid grid-cols-[44px_minmax(220px,2fr)_minmax(110px,1fr)_70px_140px_150px_90px_70px] ${ROW}`,
  headers: ["SL", "Product Name", "Price", "Stock", "Approval", "Featured / Popular", "Status", "Action"],
  minWidth: 1020,
  cells: ["h-3 w-5 rounded-[5px]", "h-3 w-3/4 rounded-[5px]", "h-3 w-16 rounded-[5px]", "h-3 w-8 rounded-[5px]", "h-6 w-28 rounded-full", "h-6 w-24 rounded-full", "h-6 w-16 rounded-full", "ml-auto h-8 w-8 rounded-sm"],
} as const;
