import { ListCard, ListHeading, TableSkeleton } from "@/components/catalog/list-parts";
import { ADMIN_PRODUCT_ICON, ADMIN_PRODUCT_TABLE, PRODUCT_MANAGE_CRUMB } from "@/components/admin-products/admin-product-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Loading() {
  return (
    <DashboardShell role="admin" breadcrumb={[PRODUCT_MANAGE_CRUMB, { label: "Products" }]}>
      <ListHeading title="Products" icon={ADMIN_PRODUCT_ICON} />
      <ListCard>
        <TableSkeleton label="Products" columns={ADMIN_PRODUCT_TABLE.columns} headers={ADMIN_PRODUCT_TABLE.headers} minWidth={ADMIN_PRODUCT_TABLE.minWidth} cells={ADMIN_PRODUCT_TABLE.cells} />
      </ListCard>
    </DashboardShell>
  );
}
