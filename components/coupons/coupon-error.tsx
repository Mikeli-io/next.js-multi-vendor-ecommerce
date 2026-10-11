"use client";

import { useEffect } from "react";

import { ListHeading } from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardError } from "@/components/dashboard/page-states";
import { COUPON_ICON, COUPONS_CRUMB } from "./coupon-parts";

/** The coupon pages' "Error" state. `retry` re-fetches the segment (Next 16.3+). */
export function CouponError({ error, retry, heading, title }: { error: Error & { digest?: string }; retry: () => void; heading: string; title: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <DashboardShell role="vendor" breadcrumb={[COUPONS_CRUMB, { label: heading }]} user={null}>
      <ListHeading title={heading} icon={COUPON_ICON} />
      <DashboardError title={title} body="Something went wrong. Please try again." onRetry={retry} />
    </DashboardShell>
  );
}
