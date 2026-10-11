import { PRODUCT_MANAGE_CRUMB } from "@/components/admin-products/admin-product-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/** The design's loading state: image block beside title and description lines. */
export default function Loading() {
  return (
    <DashboardShell role="admin" breadcrumb={[PRODUCT_MANAGE_CRUMB, { label: "Product Details" }]}>
      <div aria-busy="true" aria-label="Loading product" className="flex flex-col gap-[22px]">
        <div className="skeleton h-6 w-48 rounded-[7px]" />
        <div className="grid gap-8 rounded-[18px] border border-line-soft bg-surface p-6 shadow-xs lg:grid-cols-[320px_1fr]">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="flex flex-col gap-[14px]">
            <div className="skeleton h-[26px] w-1/2 rounded-[8px]" />
            <div className="skeleton h-[90px] rounded-[8px]" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
