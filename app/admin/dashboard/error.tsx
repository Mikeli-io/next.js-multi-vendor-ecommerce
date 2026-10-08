"use client";

import { useEffect } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardError } from "@/components/dashboard/page-states";

/** The design's "Error" state. `retry` re-fetches the segment (Next 16.3+). */
export default function AdminDashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell role="admin" user={null}>
      <DashboardError
        title="Couldn't load dashboard"
        body="Something went wrong while loading platform analytics. Please try again."
        onRetry={retry}
      />
    </DashboardShell>
  );
}
