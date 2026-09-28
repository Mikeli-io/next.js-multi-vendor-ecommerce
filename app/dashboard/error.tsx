"use client";

import { useEffect } from "react";

import { AccountHeading, AccountShell } from "@/components/account/account-shell";
import { DashboardError } from "@/components/dashboard/page-states";

/** The design's "Error" state. `retry` re-fetches the segment (Next 16.3+). */
export default function CustomerDashboardError({
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
    <AccountShell>
      <AccountHeading>Profile Info</AccountHeading>
      <div className="mt-6">
        <DashboardError
          title="Couldn't load your profile"
          body="Something went wrong while fetching your account details. Please try again."
          onRetry={retry}
        />
      </div>
    </AccountShell>
  );
}
