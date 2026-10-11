"use client";

import { Dialog } from "@/components/ui/dialog";
import type { CouponRow } from "@/lib/coupons/queries";
import { DISCOUNT_BEARER, appliesToLabel, discountHeadline, longDay, maximumDiscount, money, schedule, typeLabel } from "./coupon-parts";

/**
 * View Coupon, after the VendorCoupon design's details modal: the coupon's
 * terms on the left, and the discount itself — "75% Off", "$50.00 Off",
 * "Free" — as the strongest element, in a white disc on the iris panel.
 */
export function CouponViewDialog({ coupon, onClose }: { coupon: CouponRow | null; onClose: () => void }) {
  const state = coupon ? schedule(coupon) : "running";
  const headline = coupon ? discountHeadline(coupon) : "";

  return (
    <Dialog open={coupon !== null} onClose={onClose} title={coupon ? `Coupon ${coupon.code}` : "Coupon"} size="lg" bare>
      {coupon ? (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_250px]">
          <div className="order-2 px-6 py-7 sm:order-1 sm:px-8 sm:py-8">
            <h2 className="break-words pr-8 font-display text-[19px] font-bold leading-[1.25] text-ink sm:pr-0">{coupon.title}</h2>
            <p className="mt-3 text-[13px] font-semibold text-ink">
              Code : <span className="font-mono tracking-[0.02em] text-iris-500">{coupon.code}</span>
            </p>
            <p className="mt-[10px] text-[13px] text-muted">
              {typeLabel(coupon)}
              {coupon.status === "INACTIVE" ? " · Inactive" : state === "expired" ? " · Expired" : state === "scheduled" ? " · Not started yet" : ""}
            </p>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-[14px] gap-y-[11px] text-[13px]">
              {[
                ["Applies To", coupon.appliesTo === "ALL_PRODUCTS" ? "All products" : `${appliesToLabel(coupon)} (specific)`],
                ["Minimum Purchase", money(coupon.minPurchase)],
                ["Maximum Discount", maximumDiscount(coupon)],
                ["Start Date", longDay(coupon.startDate)],
                ["Expire Date", longDay(coupon.expireDate)],
                ["Same User Limit", String(coupon.limitPerUser)],
                ["Discount Bearer", DISCOUNT_BEARER],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-semibold text-ink">: {value}</dd>
                </div>
              ))}
            </dl>
            {coupon.appliesTo === "SPECIFIC_PRODUCTS" ? (
              <div className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-soft">Products</p>
                {coupon.products.length ? (
                  <ul aria-label="Products this coupon applies to" className="mt-2 flex max-h-[120px] flex-wrap gap-[6px] overflow-y-auto">
                    {coupon.products.map((product) => (
                      <li key={product.id} className="max-w-full truncate rounded-full bg-iris-50 px-[10px] py-1 text-[12px] font-semibold text-iris-600">
                        {product.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[12.5px] text-warning">Its products were deleted — edit the coupon to choose new ones.</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="relative order-1 flex items-center justify-center bg-[linear-gradient(135deg,var(--iris-600),#2e1f6b)] py-8 sm:order-2 sm:py-0">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[10px] bg-iris-300 sm:inset-y-0 sm:left-[-1px] sm:right-auto sm:h-auto sm:w-[14px]" />
            <div className="flex size-[150px] flex-col items-center justify-center rounded-full bg-surface text-center sm:size-[170px]">
              <span
                data-headline
                className={`font-display font-extrabold leading-none tracking-[-0.02em] text-ink ${headline.length > 6 ? "text-[28px]" : "text-[40px]"}`}
              >
                {headline}
              </span>
              <span className="mt-2 font-display text-[15px] font-semibold text-iris-500">{headline === "Free" ? "Delivery" : "Off"}</span>
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
