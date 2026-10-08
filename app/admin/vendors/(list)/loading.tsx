import { ListCard, ListHeading, TableSkeleton } from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VENDOR_LIST_TABLE, VENDOR_ICON, VENDOR_MANAGE_CRUMB } from "@/components/vendors/vendor-parts";

export default function Loading() {
  return (
    <DashboardShell role="admin" breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Vendor List" }]}>
      <ListHeading title="Vendor List" icon={VENDOR_ICON} />
      <ListCard>
        <TableSkeleton label="Vendor List" columns={VENDOR_LIST_TABLE.columns} headers={VENDOR_LIST_TABLE.headers} minWidth={VENDOR_LIST_TABLE.minWidth} cells={VENDOR_LIST_TABLE.cells} />
      </ListCard>
    </DashboardShell>
  );
}
