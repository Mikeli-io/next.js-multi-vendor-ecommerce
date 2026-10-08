import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PROFILE_CRUMBS, ProfileHeader } from "@/components/vendors/profile-parts";

/** The design's "Loading" state. */
export default function Loading() {
  return (
    <DashboardShell role="vendor" breadcrumb={PROFILE_CRUMBS}>
      <ProfileHeader active="password" />
      <div aria-busy="true" aria-label="Loading" className="rounded-[18px] border border-line-soft bg-surface p-5 shadow-xs sm:p-[28px_30px]">
        <div className="grid grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex flex-col gap-[10px]">
              <div className="skeleton h-[14px] w-2/5 rounded-[6px]" />
              <div className="skeleton h-[50px] rounded-[12px]" />
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
