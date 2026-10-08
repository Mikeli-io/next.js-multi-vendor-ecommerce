import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PRODUCTS_CRUMB } from "@/components/products/product-parts";

export default function Loading() {
  return (
    <DashboardShell role="vendor" breadcrumb={[PRODUCTS_CRUMB, { label: "Product" }]}>
      <div aria-busy="true" aria-label="Loading product" className="flex flex-col gap-[22px]">
        <div className="skeleton h-4 w-28 rounded-[5px]" />
        <div className="flex items-center gap-4 rounded-xl border border-line-soft bg-surface p-6 shadow-xs">
          <div className="skeleton size-[72px] rounded-[10px]" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="skeleton h-6 w-64 max-w-full rounded-[7px]" />
            <div className="skeleton h-5 w-48 rounded-full" />
          </div>
        </div>
        <div className="grid gap-[22px] lg:grid-cols-[1.6fr_1fr]">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    </DashboardShell>
  );
}
