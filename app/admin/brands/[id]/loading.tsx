import { BRAND_BREADCRUMB } from "@/components/brands/brand-list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function BrandDetailsLoading() {
  return (
    <DashboardShell role="admin" breadcrumb={[...BRAND_BREADCRUMB, { label: "Brands" }]}>
      <div aria-busy="true" aria-label="Loading brand" className="flex flex-col gap-[22px]">
        <div className="skeleton h-4 w-24 rounded-[5px]" />
        <div className="flex gap-6 rounded-xl border border-line-soft bg-surface p-6 shadow-xs">
          <div className="skeleton size-[120px] flex-none rounded-lg" />
          <div className="flex flex-1 flex-col gap-4">
            <div className="skeleton h-7 w-48 max-w-full rounded-[7px]" />
            <div className="skeleton h-6 w-32 rounded-full" />
            <div className="skeleton h-20 w-full rounded-lg" />
          </div>
        </div>
        <div className="skeleton h-56 rounded-xl" />
      </div>
    </DashboardShell>
  );
}
