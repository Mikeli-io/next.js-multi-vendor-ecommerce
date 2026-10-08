import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PROFILE_CARD, PROFILE_CRUMBS, ProfileHeader } from "@/components/vendors/profile-parts";
import { StoreBranding } from "@/components/vendors/store-branding";
import { VendorProfileForm } from "@/components/vendors/vendor-profile-form";
import { VendorStoreForm } from "@/components/vendors/vendor-store-form";
import { getOwnVendorProfile } from "@/lib/vendors/profile";

export const metadata: Metadata = { title: "Profile Settings · Covet" };

/**
 * Basic Information tab, after VendorProfile.dc.html: store branding header,
 * the owner's Basic Information, then Store Information and Business TIN
 * (fields from Add New Vendor).
 */
export default async function VendorProfilePage() {
  const profile = await getOwnVendorProfile();
  const name = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <DashboardShell role="vendor" breadcrumb={PROFILE_CRUMBS} user={{ name, subtitle: profile.maskedEmail }}>
      <ProfileHeader active="basic" />
      <div className={PROFILE_CARD}>
        {/* Store logo = Vendor.logo, banner = Vendor.coverImage. */}
        <StoreBranding storeName={profile.storeName} logo={profile.logo} coverImage={profile.coverImage} />
        <VendorProfileForm
          // Remount with fresh values after a save re-renders the page.
          key={`${name}|${profile.phone}`}
          initial={{ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? "" }}
          email={profile.email}
        />
      </div>
      <VendorStoreForm
        // Remount with the saved values (and certificate state) after a save.
        key={[profile.storeName, profile.address, profile.tinNumber, profile.tinExpireDate, profile.tinCertificate?.ext].join("|")}
        initial={{
          storeName: profile.storeName,
          address: profile.address ?? "",
          tinNumber: profile.tinNumber ?? "",
          tinExpireDate: profile.tinExpireDate ?? "",
        }}
        certificate={profile.tinCertificate}
      />
    </DashboardShell>
  );
}
