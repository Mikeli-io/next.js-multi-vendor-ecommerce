import { ListCard, ListHeading, TableSkeleton } from "@/components/catalog/list-parts";
import { COUPON_ICON, COUPON_TABLE, COUPONS_CRUMB } from "@/components/coupons/coupon-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Loading() {
  return (
    <DashboardShell role="vendor" breadcrumb={[COUPONS_CRUMB, { label: "Coupon List" }]}>
      <ListHeading title="Coupon List" icon={COUPON_ICON} />
      <ListCard>
        <TableSkeleton label="Coupons" columns={COUPON_TABLE.columns} headers={COUPON_TABLE.headers} minWidth={COUPON_TABLE.minWidth} cells={COUPON_TABLE.cells} rows={5} />
      </ListCard>
    </DashboardShell>
  );
}
