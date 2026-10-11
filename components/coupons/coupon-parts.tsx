import type { CouponRow } from "@/lib/coupons/queries";
import { TicketIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/format";
import { COUPON_TYPE_LABEL } from "@/lib/validation/coupon";

/** Shared pieces of the vendor coupon pages (list, create, edit, view). */

export const COUPON_ICON = TicketIcon;

export const COUPONS_CRUMB = { label: "Coupon Manage", href: "/vendor/coupons" };

/** Vendor coupons are always paid for by the vendor (the design's "Discount Bearer"). */
export const DISCOUNT_BEARER = "Vendor";

export const typeLabel = (coupon: Pick<CouponRow, "type">) => COUPON_TYPE_LABEL[coupon.type];

/** "All products", "1 product", "3 products" — or "No products" once every linked product was deleted. */
export function appliesToLabel(coupon: Pick<CouponRow, "appliesTo" | "products">): string {
  if (coupon.appliesTo === "ALL_PRODUCTS") return "All products";
  const n = coupon.products.length;
  return n === 0 ? "No products" : `${n} product${n === 1 ? "" : "s"}`;
}

/** Display only — money is never computed from this. */
export const money = (value: string) => formatMoney(Number(value));

/** The headline value: "75%", "$50.00" or "Free" (free delivery). */
export function discountHeadline(coupon: Pick<CouponRow, "type" | "discountType" | "discount">): string {
  if (coupon.type === "FREE_DELIVERY" || coupon.discount === null) return "Free";
  return coupon.discountType === "PERCENTAGE" ? `${Number(coupon.discount)}%` : money(coupon.discount);
}

/** The modal's "Maximum Discount": the cap for a percentage, the amount itself, or free shipping. */
export function maximumDiscount(coupon: Pick<CouponRow, "type" | "discountType" | "discount" | "maxDiscount">): string {
  if (coupon.type === "FREE_DELIVERY") return "Free Shipping";
  if (coupon.discountType === "PERCENTAGE") return coupon.maxDiscount ? money(coupon.maxDiscount) : "No limit";
  return coupon.discount ? money(coupon.discount) : "—";
}

const UTC = { timeZone: "UTC" } as const;
const short = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "2-digit", ...UTC });
const long = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", ...UTC });
const asDate = (day: string) => new Date(`${day}T00:00:00Z`);

/** "10 Jan 25" — the list's Duration. */
export const shortDay = (day: string) => short.format(asDate(day));
/** "10 Jan 2025" — the modal. */
export const longDay = (day: string) => long.format(asDate(day));

/** Derived from the dates (nothing stored): has it started, or already ended? */
export function schedule(coupon: Pick<CouponRow, "startDate" | "expireDate">): "scheduled" | "running" | "expired" {
  const today = new Date().toISOString().slice(0, 10);
  if (coupon.expireDate < today) return "expired";
  if (coupon.startDate > today) return "scheduled";
  return "running";
}

const ROW = "items-center gap-[14px] px-[18px]";

/** Coupon List, after VendorCoupon.dc.html (SL · Coupon · Type · Duration · Limit · Bearer · Status · Action). */
export const COUPON_TABLE = {
  columns: `grid grid-cols-[44px_minmax(170px,1.5fr)_minmax(130px,1.2fr)_minmax(120px,1.1fr)_minmax(140px,1.2fr)_100px_80px_120px] ${ROW}`,
  headers: ["SL", "Coupon", "Coupon Type", "Duration", "Limit", "Discount Bearer", "Status", "Action"],
  minWidth: 1000,
  cells: ["h-3 w-5 rounded-[5px]", "h-3 w-3/4 rounded-[5px]", "h-3 w-2/3 rounded-[5px]", "h-3 w-3/4 rounded-[5px]", "h-3 w-2/3 rounded-[5px]", "h-3 w-12 rounded-[5px]", "h-[22px] w-[38px] rounded-full", "ml-auto h-8 w-28 rounded-sm"],
} as const;
