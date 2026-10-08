import type { ProductApprovalStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { BoxIcon } from "@/components/ui/icons";
import { ImageThumb } from "@/components/ui/image-thumb";
import { formatMoney } from "@/lib/format";

/** Shared pieces of the vendor product pages (list, view, add, edit). */

export const PRODUCT_ICON = BoxIcon;

export const PRODUCTS_CRUMB = { label: "Products", href: "/vendor/products" };

const APPROVAL: Record<ProductApprovalStatus, { label: string; tone: "warning" | "success" | "error" }> = {
  PENDING: { label: "Pending approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "error" },
};

/** Admin moderation status — never the vendor's on/off switch. */
export function ApprovalBadge({ status }: { status: ProductApprovalStatus }) {
  const meta = APPROVAL[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** The vendor's own on/off switch, read-only. */
export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? "success" : "neutral"}>{active ? "Active" : "Inactive"}</Badge>;
}

/** A decimal string ("12.50") for display. Display only — money is never computed from this. */
export const money = (value: string) => formatMoney(Number(value));

/** "$12.00" for a simple product; "$9.00 – $15.00" across variations. */
export function priceLabel(price: string, variationPrice: { min: string; max: string } | null): string {
  if (!variationPrice) return money(price);
  return variationPrice.min === variationPrice.max
    ? money(variationPrice.min)
    : `${money(variationPrice.min)} – ${money(variationPrice.max)}`;
}

export function ProductThumb({ src, name, size = 46 }: { src: string | null; name: string; size?: number }) {
  return <ImageThumb src={src} name={name} size={size} className="[&_img]:object-cover [&_img]:p-0" />;
}

const ROW = "items-center gap-[14px] px-[18px]";

/** Product List, after VendorProductList.dc.html (Product Type and the barcode action left out: no such data/feature). */
export const PRODUCT_TABLE = {
  columns: `grid grid-cols-[44px_minmax(220px,2fr)_minmax(110px,1fr)_80px_150px_110px_120px] ${ROW}`,
  headers: ["SL", "Product Name", "Price", "Stock", "Approval Status", "Active Status", "Action"],
  minWidth: 960,
  cells: ["h-3 w-5 rounded-[5px]", "h-3 w-3/4 rounded-[5px]", "h-3 w-16 rounded-[5px]", "h-3 w-8 rounded-[5px]", "h-6 w-28 rounded-full", "h-[22px] w-[38px] rounded-full", "ml-auto h-8 w-28 rounded-sm"],
} as const;
