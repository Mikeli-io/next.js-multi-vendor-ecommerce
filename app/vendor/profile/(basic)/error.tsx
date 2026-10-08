"use client";

import { useEffect } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardError } from "@/components/dashboard/page-states";
import { PROFILE_CRUMBS, ProfileHeader } from "@/components/vendors/profile-parts";

/** The design's "Error" state. `retry` re-fetches the segment (Next 16.3+). */
export default function ProfileError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell role="vendor" breadcrumb={PROFILE_CRUMBS} user={null}>
      <ProfileHeader active="basic" />
      <DashboardError title="Couldn't load your profile" body="Something went wrong. Please try again." onRetry={retry} />
    </DashboardShell>
  );
}
