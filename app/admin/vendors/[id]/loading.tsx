import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VENDOR_MANAGE_CRUMB } from "@/components/vendors/vendor-parts";

export default function Loading() {
  return (
    <DashboardShell role="admin" breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Vendor" }]}>
      <div aria-busy="true" aria-label="Loading vendor" className="flex flex-col gap-[22px]">
        <div className="skeleton h-4 w-28 rounded-[5px]" />
        <div className="flex flex-col gap-5 rounded-xl border border-line-soft bg-surface p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="skeleton size-16 rounded-lg" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="skeleton h-6 w-56 max-w-full rounded-[7px]" />
              <div className="skeleton h-5 w-40 rounded-full" />
            </div>
          </div>
          <div className="skeleton h-24 rounded-lg" />
        </div>
        <div className="skeleton h-40 rounded-xl" />
        <div className="grid gap-[22px] lg:grid-cols-2">
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    </DashboardShell>
  );
}
