"use client";

import { useEffect } from "react";

import { ListHeading } from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardError } from "@/components/dashboard/page-states";
import { PRODUCT_ICON, PRODUCTS_CRUMB } from "./product-parts";

/** The product pages' "Error" state. `retry` re-fetches the segment (Next 16.3+). */
export function ProductError({
  error,
  retry,
  heading,
  title,
  body = "Something went wrong while loading this page. Please try again.",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  heading: string;
  title: string;
  body?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell role="vendor" breadcrumb={[PRODUCTS_CRUMB, { label: heading }]} user={null}>
      <ListHeading title={heading} icon={PRODUCT_ICON} />
      <DashboardError title={title} body={body} onRetry={retry} />
    </DashboardShell>
  );
}
