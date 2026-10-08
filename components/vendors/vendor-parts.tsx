import { Badge } from "@/components/ui/badge";
import { ShopFrontIcon } from "@/components/ui/icons";
import { ImageThumb } from "@/components/ui/image-thumb";
import type { AppVendorStatus } from "@/lib/auth/roles";
import { VENDOR_STATUS_META } from "@/lib/vendors/status";

/** Shared pieces of the admin vendor pages (Vendor Approval, Vendor List, detail). */

export const VENDOR_ICON = ShopFrontIcon;

export const VENDOR_MANAGE_CRUMB = { label: "Vendor Manage", href: "/admin/vendors" };

export function VendorStatusBadge({ status }: { status: AppVendorStatus }) {
  const meta = VENDOR_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** The shop logo, or the store initial in a tinted tile when it has none. */
export function StoreTile({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) return <ImageThumb src={logo} name={name} size={40} />;
  return (
    <span
      aria-hidden="true"
      className="grid size-10 flex-none place-items-center rounded-[11px] bg-iris-50 font-display text-[15px] font-bold uppercase text-iris-500"
    >
      {name.trim().charAt(0)}
    </span>
  );
}

/** Placeholder for an optional vendor field that has no value. */
export function NotProvided() {
  return <span className="font-normal text-muted-soft">Not provided</span>;
}

/** The owner's phone, or a muted note for accounts created before it was collected. */
export function OwnerPhone({ phone }: { phone: string | null }) {
  return phone ? <>{phone}</> : <NotProvided />;
}

/** Email over phone — the design's "Contact Info" cell. */
export function ContactCell({ email, phone }: { email: string; phone: string | null }) {
  return (
    <span role="cell" className="min-w-0 text-[12.5px] leading-[1.5] text-muted">
      <span className="block truncate">{email}</span>
      <span className="block truncate">
        <OwnerPhone phone={phone} />
      </span>
    </span>
  );
}

const ROW = "items-center gap-[14px] px-[18px]";

/** Vendor Approval: the review queue. */
export const APPROVAL_TABLE = {
  columns: `grid grid-cols-[minmax(170px,1.4fr)_minmax(130px,1fr)_minmax(170px,1.2fr)_120px_110px_70px] ${ROW}`,
  headers: ["Store Name", "Owner", "Contact Info", "Registered", "Status", "Action"],
  minWidth: 820,
  cells: ["h-3 w-3/4 rounded-[5px]", "h-3 w-1/2 rounded-[5px]", "h-3 w-3/4 rounded-[5px]", "h-3 w-20 rounded-[5px]", "h-6 w-20 rounded-full", "ml-auto h-8 w-8 rounded-sm"],
} as const;

/** Vendor List, after AdminVendorList.dc.html (SL · Shop · Vendor · Contact · Status · Products · Orders · Action). */
export const VENDOR_LIST_TABLE = {
  columns: `grid grid-cols-[44px_minmax(190px,1.6fr)_minmax(130px,1.1fr)_minmax(170px,1.3fr)_110px_120px_110px_70px] ${ROW}`,
  headers: ["SL", "Shop Name", "Vendor Name", "Contact Info", "Status", "Total Products", "Total Orders", "Action"],
  minWidth: 980,
  cells: ["h-3 w-5 rounded-[5px]", "h-3 w-3/4 rounded-[5px]", "h-3 w-1/2 rounded-[5px]", "h-3 w-3/4 rounded-[5px]", "h-6 w-20 rounded-full", "h-3 w-6 rounded-[5px]", "h-3 w-6 rounded-[5px]", "ml-auto h-8 w-8 rounded-sm"],
} as const;
