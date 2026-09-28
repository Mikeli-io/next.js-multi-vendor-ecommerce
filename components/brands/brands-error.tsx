"use client";

import { useEffect } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardError } from "@/components/dashboard/page-states";
import { BRAND_BREADCRUMB, ListHeading } from "./brand-list-parts";

/**
 * The list design's error state, shared by the brand list's and brand
 * details' `error.tsx`. `retry` re-fetches the failed segment (Next 16.3+).
 */
export function BrandsError({
  error,
  retry,
  title,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell
      role="admin"
      section="catalog"
      breadcrumb={[...BRAND_BREADCRUMB, { label: "Brand Setup", href: "/admin/brands" }]}
      user={null}
    >
      <ListHeading title="Brands" />
      <DashboardError
        title={title}
        body="Something went wrong while loading brand data. Please try again."
        onRetry={retry}
      />
    </DashboardShell>
  );
}
