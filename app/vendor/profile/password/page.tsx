import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PROFILE_CRUMBS, ProfileHeader } from "@/components/vendors/profile-parts";
import { VendorPasswordForm } from "@/components/vendors/vendor-password-form";
import { getOwnVendorProfile } from "@/lib/vendors/profile";

export const metadata: Metadata = { title: "Change Password · Covet" };

/** Password tab, after VendorChangePassword.dc.html. */
export default async function VendorPasswordPage() {
  const profile = await getOwnVendorProfile();

  return (
    <DashboardShell
      role="vendor"
      breadcrumb={PROFILE_CRUMBS}
      user={{ name: `${profile.firstName} ${profile.lastName}`.trim(), subtitle: profile.maskedEmail }}
    >
      <ProfileHeader active="password" />
      <VendorPasswordForm />
    </DashboardShell>
  );
}
