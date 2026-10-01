"use client";

import { useEffect, type ComponentType } from "react";

import { DashboardShell, type Crumb } from "@/components/dashboard/dashboard-shell";
import { DashboardError } from "@/components/dashboard/page-states";
import type { IconProps } from "@/components/ui/icons";
import { ListHeading } from "./list-parts";

/**
 * The list design's error state, shared by the catalog routes' `error.tsx`.
 * `retry` re-fetches the failed segment (Next 16.3+).
 */
export function CatalogError({
  error,
  retry,
  heading,
  icon,
  title,
  breadcrumb,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  heading: string;
  icon: ComponentType<IconProps>;
  title: string;
  breadcrumb: Crumb[];
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell role="admin" breadcrumb={breadcrumb} user={null}>
      <ListHeading title={heading} icon={icon} />
      <DashboardError
        title={title}
        body="Something went wrong while loading this data. Please try again."
        onRetry={retry}
      />
    </DashboardShell>
  );
}
