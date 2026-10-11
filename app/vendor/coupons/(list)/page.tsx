import Link from "next/link";
import type { Metadata } from "next";

import { ListCard, ListHeading, NoMatches, Pagination, ROW_CLASS, ResultCount, SearchToolbar, TableFrame } from "@/components/catalog/list-parts";
import { CouponRowActions, CouponStatusSwitch } from "@/components/coupons/coupon-actions";
import { COUPON_ICON, COUPON_TABLE, COUPONS_CRUMB, DISCOUNT_BEARER, appliesToLabel, schedule, shortDay, typeLabel } from "@/components/coupons/coupon-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { getOwnCoupons } from "@/lib/coupons/queries";
import { maskEmail } from "@/lib/format";
import { param } from "@/lib/validation/catalog";
import { couponListParamsSchema } from "@/lib/validation/coupon";

export const metadata: Metadata = { title: "Coupon List · Covet" };

const CREATE_LINK =
  "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-[12px] bg-iris-500 px-[18px] font-display text-[13px] font-bold leading-none text-surface transition-colors duration-200 hover:bg-iris-600 hover:text-surface";

/**
 * Coupon List — the list card of VendorCoupon.dc.html on its own page. Only
 * the signed-in vendor's coupons are queried; search (title or code) narrows
 * within them.
 *
 * Not built from the design: Export (no export feature). "Total Used" shows a
 * dash: coupons can't be redeemed until checkout exists, and no count is invented.
 */
export default async function CouponListPage({ searchParams }: PageProps<"/vendor/coupons">) {
  const user = await requireApprovedVendor();
  const raw = await searchParams;
  const params = couponListParamsSchema.parse({ q: param(raw.q), page: param(raw.page) });
  const { total, matching, page, pageCount, pageSize, coupons } = await getOwnCoupons(params);

  return (
    <DashboardShell
      role="vendor"
      breadcrumb={[COUPONS_CRUMB, { label: "Coupon List" }]}
      user={{ name: user.name, subtitle: maskEmail(user.email) }}
    >
      <ListHeading
        title="Coupon List"
        icon={COUPON_ICON}
        count={total}
        action={
          <Link href="/vendor/coupons/new" className={CREATE_LINK}>
            <PlusIcon size={16} />
            Create coupon
          </Link>
        }
      />

      <ListCard>
        {total === 0 ? (
          <EmptyState
            icon={COUPON_ICON}
            title="No coupons yet"
            body="Create your first coupon to offer customers a discount or free delivery."
            action={
              <Link href="/vendor/coupons/new" className={CREATE_LINK}>
                <PlusIcon size={16} />
                Create coupon
              </Link>
            }
          />
        ) : (
          <>
            <SearchToolbar action="/vendor/coupons" q={params.q} placeholder="Search by Title or Code" />
            {params.q ? <ResultCount shown={matching} total={total} noun="coupons" /> : null}
            {coupons.length === 0 ? (
              <NoMatches clearHref="/vendor/coupons" noun="coupons" />
            ) : (
              <TableFrame label="Coupons" columns={COUPON_TABLE.columns} headers={COUPON_TABLE.headers} minWidth={COUPON_TABLE.minWidth}>
                {coupons.map((c, index) => {
                  const when = schedule(c);
                  return (
                    <div key={c.id} role="row" className={`${COUPON_TABLE.columns} ${ROW_CLASS}`}>
                      <span role="cell" className="text-[13px] font-medium text-muted">{(page - 1) * pageSize + index + 1}</span>
                      <span role="cell" className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-ink" title={c.title}>{c.title}</span>
                        <span className="mt-[6px] block truncate font-display text-[12px] font-bold text-ink">Code: {c.code}</span>
                      </span>
                      <span role="cell" className="text-[13px] text-ink-soft">
                        {typeLabel(c)}
                        <span className={`mt-1 block text-[11.5px] font-semibold ${c.appliesTo === "SPECIFIC_PRODUCTS" && !c.products.length ? "text-warning" : "text-iris-500"}`}>
                          {appliesToLabel(c)}
                        </span>
                      </span>
                      <span role="cell" className="text-[12.5px] text-ink-soft">
                        {shortDay(c.startDate)} – {shortDay(c.expireDate)}
                        {when !== "running" ? (
                          <span className={`mt-1 block text-[11.5px] font-semibold ${when === "expired" ? "text-error" : "text-warning"}`}>
                            {when === "expired" ? "Expired" : "Not started yet"}
                          </span>
                        ) : null}
                      </span>
                      <span role="cell" className="text-[12.5px] leading-[1.6] text-ink-soft">
                        <span className="block">Same User Limit: <span className="font-semibold text-ink">{c.limitPerUser}</span></span>
                        <span className="block" title="Usage is counted once checkout exists">Total Used: <span className="text-muted-soft">—</span></span>
                      </span>
                      <span role="cell" className="text-[13px] font-medium text-ink-soft">{DISCOUNT_BEARER}</span>
                      <span role="cell"><CouponStatusSwitch id={c.id} code={c.code} active={c.status === "ACTIVE"} /></span>
                      <span role="cell"><CouponRowActions coupon={c} /></span>
                    </div>
                  );
                })}
              </TableFrame>
            )}
            <Pagination path="/vendor/coupons" page={page} pageCount={pageCount} pageSize={pageSize} matching={matching} noun="coupons" keep={{ q: params.q }} />
          </>
        )}
      </ListCard>
    </DashboardShell>
  );
}
